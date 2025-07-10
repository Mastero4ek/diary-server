const { ApiError } = require('../exceptions/api-error')
const tokenService = require('../service/token-service')

module.exports = function (req, res, next) {
	try {
		// First try to get token from cookies
		let accessToken = req.cookies.access_token

		// If no access token in cookies, try refresh token
		if (!accessToken && req.cookies.refresh_token) {
			const userData = tokenService.validateRefreshToken(
				req.cookies.refresh_token
			)

			if (userData) {
				// If refresh token is valid, proceed with the request
				req.user = userData

				return next()
			}
		}

		// Fallback to Authorization header if no valid cookies
		if (!accessToken) {
			const authorizationHeader = req.headers.authorization

			if (!authorizationHeader) {
				return next(ApiError.UnauthorizedError())
			}

			accessToken = authorizationHeader.split(' ')[1]

			if (!accessToken) {
				return next(ApiError.UnauthorizedError())
			}
		}

		const userData = tokenService.validateAccessToken(accessToken)

		if (!userData) {
			return next(ApiError.UnauthorizedError())
		}

		req.user = userData

		next()
	} catch (e) {
		return next(ApiError.UnauthorizedError())
	}
}
