module.exports = class ApiError extends Error {
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
