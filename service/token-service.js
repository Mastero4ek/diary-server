const jwt = require('jsonwebtoken')
const TokenModel = require('../models/token-model')
const ApiError = require('../exceptions/api-error')

class TokenService {
	async generateTokens(payload) {
		try {
			const access_token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
				expiresIn: '30m',
			})
			const refresh_token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
				expiresIn: '30d',
			})
			return {
				access_token,
				refresh_token,
			}
		} catch (error) {
			console.error('Token generation error:', error)
			throw ApiError.InternalError('Failed to generate tokens')
		}
	}

	async saveToken(userId, refresh_token) {
		try {
			if (!userId || !refresh_token) {
				throw ApiError.BadRequest('User ID and refresh token are required')
			}

			const tokenData = await TokenModel.findOne({ user: userId })
			if (tokenData) {
				tokenData.refresh_token = refresh_token
				return await tokenData.save()
			}

			const token = await TokenModel.create({
				user: userId,
				refresh_token: refresh_token,
			})
			return token
		} catch (error) {
			console.error('Token save error:', error)
			throw ApiError.InternalError('Failed to save token')
		}
	}

	async removeToken(refresh_token) {
		try {
			if (!refresh_token) {
				throw ApiError.BadRequest('Refresh token is required')
			}
			const tokenData = await TokenModel.deleteOne({ refresh_token })
			return tokenData
		} catch (error) {
			console.error('Token removal error:', error)
			throw ApiError.InternalError('Failed to remove token')
		}
	}

	async findToken(refresh_token) {
		try {
			if (!refresh_token) {
				throw ApiError.BadRequest('Refresh token is required')
			}
			const tokenData = await TokenModel.findOne({ refresh_token })
			return tokenData
		} catch (error) {
			console.error('Token find error:', error)
			throw ApiError.InternalError('Failed to find token')
		}
	}

	validateAccessToken(token) {
		try {
			const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
			return userData
		} catch (e) {
			return null
		}
	}

	validateRefreshToken(token) {
		try {
			const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
			return userData
		} catch (e) {
			return null
		}
	}
}

module.exports = new TokenService()
