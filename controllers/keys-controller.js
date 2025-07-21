const keysService = require('../service/keys-service')

class KeysController {
	async updateKeys(req, res, next) {
		try {
			const { exchange, api, secret } = req.body
			const user = req.user

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
