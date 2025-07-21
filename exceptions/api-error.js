const i18next = require('i18next')

class ApiError extends Error {
	status
	errors

	constructor(status, message, errors = []) {
		super(message)

		this.status = status
		this.errors = errors
	}

	static UnauthorizedError() {
		return new ApiError(401, 'UNAUTHORIZED')
	}

	static BadRequest(message, errors = []) {
		return new ApiError(400, message, errors)
	}

	static InternalError(message = 'Internal Server Error', errors = []) {
		return new ApiError(500, message, errors)
	}
}

function localizedError(key, language = 'en', options = {}) {
	return i18next.t(key, { lng: language, ...options })
}

module.exports = { ApiError, localizedError }
