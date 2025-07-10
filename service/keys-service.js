const KeysModel = require('../models/keys-model')
const UserModel = require('../models/user-model')
const KeysDto = require('../dtos/keys-dto')
const { ApiError } = require('../exceptions/api-error')
const i18next = require('i18next')

class KeysService {
	async findKeys(userId, lng) {
		const keys = await KeysModel.findOne({ user: userId })

		if (!keys) {
			throw ApiError.BadRequest(i18next.t('errors.keys_not_found', { lng }))
		}

		return keys
	}

	async updateKeys(userId, exchange, api, secret, lng) {
		const keys = await KeysModel.findOne({ user: userId })
		if (!keys) {
			throw ApiError.BadRequest(i18next.t('errors.keys_not_found', { lng }))
		}

		keys.keys = keys.keys.map(key => {
			if (key.name === exchange) {
				return {
					...key,
					api: api !== key.api ? api : key.api,
					secret: secret !== key.secret ? secret : key.secret,
				}
			}

			return key
		})

		await keys.save()

		const keys_dto = new KeysDto(keys)

		return keys_dto
	}

	async removeKeys(email, lng) {
		const user = await UserModel.findOne({ email })
		const keys = await KeysModel.findOneAndDelete({ user: user._id })

		if (!keys) {
			throw ApiError.BadRequest(i18next.t('errors.keys_not_found', { lng }))
		}

		return {
			message: i18next.t('success.keys_deleted', { lng }),
		}
	}

	async verifyKeys(email, exchange, api, secret) {
		const user = await UserModel.findOne({ email })
		if (!user) return false

		const keys = await KeysModel.findOne({ user: user._id })
		if (!keys) return false

		const exchangeKeys = keys.keys.find(key => key.name === exchange)
		if (!exchangeKeys) return false

		return exchangeKeys.api === api && exchangeKeys.secret === secret
	}

	async getOriginalKeys(userId, exchange) {
		const keys = await KeysModel.findOne({ user: userId })
		if (!keys) return null

		const exchangeKeys = keys.keys.find(key => key.name === exchange)
		if (!exchangeKeys) return null

		return {
			api: exchangeKeys.api,
			secret: exchangeKeys.secret,
		}
	}
}

module.exports = new KeysService()
