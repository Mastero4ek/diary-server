const fileService = require('../service/file-service')

class FileController {
	async removeCover(req, res, next) {
		try {
			const file_name = req.params.filename
			const user = req.user
			const { language } = req.cookies

			const file = await fileService.removeCover(file_name, user.id, language)

			return res.json(file)
		} catch (e) {
			next(e)
		}
	}
}

module.exports = new FileController()
