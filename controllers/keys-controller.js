const keysService = require('../service/keys-service')

class KeysController {
	async updateKeys(req, res, next) {
		try {
			const { exchange, api, secret } = req.body
			const user = req.user
			const { language } = req.cookies

			const keys = await keysService.updateKeys(
				user.id,
				exchange,
				api,
				secret,
				language
			)

			return res.json(keys)
		} catch (e) {
			next(e)
		}
	}
}

module.exports = new KeysController()
