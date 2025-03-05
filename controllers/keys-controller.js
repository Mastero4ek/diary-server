const keysService = require('../service/keys-service')

class KeysController {
	async updateKeys(req, res, next) {
		try {
			const { email, exchange, api, secret } = req.body
			const { language } = req.cookies

			const keys = await keysService.updateKeys(
				email,
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
