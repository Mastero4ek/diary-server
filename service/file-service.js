const FileModel = require('../models/file-model')
const UserModel = require('../models/user-model')
const fs = require('fs')
const path = require('path')
const i18next = require('i18next')

class FileService {
	async uploadCover(cover, email, lng) {
		const user = await UserModel.findOneAndUpdate(
			{ email },
			{
				$set: {
					cover: process.env.API_URL + '/uploads/' + path.basename(cover.path),
				},
			},
			{ returnDocument: 'after' }
		)

		const file = await FileModel.create({
			user: user._id,
			name: cover.filename,
			size: cover.size,
			mimetype: cover.mimetype,
		})

		await file.save()
		await user.save()

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

		return {
			message: i18next.t('success.file_deleted', { lng }),
		}
	}
}

module.exports = new FileService()
