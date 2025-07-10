const keysService = require('../service/keys-service')
const i18next = require('i18next')

class KeysController {
	async updateKeys(req, res, next) {
		try {
			const { exchange, api, secret } = req.body
			const user = req.user
			// const { language } = req.cookies // Удалено

			const keys = await keysService.updateKeys(
				user.id,
				exchange,
				api,
				secret,
				req.lng
			)

			return res.json(keys)
		} catch (e) {
			next(e)
		}
	}
}

module.exports = new KeysController()
