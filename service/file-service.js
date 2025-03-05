const FileModel = require('../models/file-model')
const UserModel = require('../models/user-model')
const fs = require('fs')
const path = require('path')

class FileService {
	async uploadCover(cover, email, language) {
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
			message:
				language === 'ru'
					? 'Файл успешно сохранен!'
					: 'File saved successfully!',
		}
	}

	async removeCover(file_name, email, language) {
		const user = await UserModel.findOne({ email })
		const file = await FileModel.findOneAndDelete({
			user: user._id,
			name: file_name,
		})

		if (!file)
			return {
				message: language === 'ru' ? 'Файл не найден!' : 'File not found!',
			}

		fs.unlinkSync('uploads/' + file.name)

		const updateUser = await UserModel.findOneAndUpdate(
			{ email },
			{
				$set: {
					cover: null,
					updated_at: new Date(),
				},
			},
			{ returnDocument: 'after' }
		)

		return {
			message:
				language === 'ru'
					? 'Файл успешно удален!'
					: 'The file was successfully deleted!',
		}
	}
}

module.exports = new FileService()
