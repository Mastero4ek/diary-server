const FileModel = require('../models/file-model')
const UserModel = require('../models/user-model')
const TournamentUserModel = require('../models/tournament_user-model')
const fs = require('fs')
const path = require('path')
const i18next = require('i18next')

class FileService {
	async uploadCover(cover, email, lng, tournamentId = null) {
		let file
		if (tournamentId) {
			// Для турнира
			file = await FileModel.create({
				user: null,
				tournament: tournamentId,
				name: cover.filename,
				size: cover.size,
				mimetype: cover.mimetype,
			})
		} else {
			// Для пользователя
			const user = await UserModel.findOne({ email })
			if (user && user.cover) {
				const filename = user.cover.split('/').pop()
				// Удаляем старый файл из FileModel и с диска
				const oldFile = await FileModel.findOneAndDelete({
					user: user._id,
					name: filename,
				})
				if (oldFile) {
					const filePath = path.join(__dirname, '../uploads', oldFile.name)
					if (fs.existsSync(filePath)) {
						try {
							fs.unlinkSync(filePath)
						} catch (err) {
							if (err.code !== 'ENOENT') throw err
							// Если файл не найден, просто продолжаем
						}
					}
				}
			}
			const updatedUser = await UserModel.findOneAndUpdate(
				{ email },
				{
					$set: {
						cover:
							process.env.API_URL + '/uploads/' + path.basename(cover.path),
					},
				},
				{ returnDocument: 'after' }
			)
			file = await FileModel.create({
				user: updatedUser._id,
				tournament: null,
				name: cover.filename,
				size: cover.size,
				mimetype: cover.mimetype,
			})
			await updatedUser.save()
			// Обновляем cover во всех TournamentUser
			await TournamentUserModel.updateMany(
				{ id: updatedUser._id },
				{ $set: { cover: updatedUser.cover } }
			)
		}
		await file.save()
		return {
			message: i18next.t('success.file_saved', { lng }),
		}
	}

	async removeCover(file_name, userId, lng) {
		const file = await FileModel.findOneAndDelete({
			user: userId,
			name: file_name,
		})
		if (!file)
			return {
				message: i18next.t('errors.file_not_found', { lng }),
			}

		fs.unlinkSync('uploads/' + file.name)

		await UserModel.findOneAndUpdate(
			{ _id: userId },
			{
				$set: {
					cover: null,
					updated_at: new Date(),
				},
			},
			{ returnDocument: 'after' }
		)
		// Обновляем cover во всех TournamentUser
		await TournamentUserModel.updateMany(
			{ id: userId },
			{ $set: { cover: null } }
		)
		return {
			message: i18next.t('success.file_deleted', { lng }),
		}
	}
}

module.exports = new FileService()
