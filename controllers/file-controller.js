const fileService = require('../service/file-service')
const i18next = require('i18next')

class FileController {
	async removeCover(req, res, next) {
		try {
			const file_name = req.params.filename
			const user = req.user
			// const { language } = req.cookies // Удалено

			const file = await fileService.removeCover(file_name, user.id, req.lng)

			return res.json(file)
		} catch (e) {
			next(e)
		}
	}
}

module.exports = new FileController()
