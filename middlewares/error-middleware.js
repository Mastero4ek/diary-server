const ApiError = require('../exceptions/api-error')
const { v4: uuidv4 } = require('uuid')

module.exports = function (err, req, res, next) {
	// Generate unique request ID for tracking
	const requestId = uuidv4()

	// Log error details
	console.error(`Error [${requestId}]:`, {
		message: err.message,
		stack: err.stack,
		timestamp: new Date().toISOString(),
		path: req.path,
		method: req.method,
		body: req.body,
		query: req.query,
	})

	// Handle API Errors
	if (err instanceof ApiError) {
		return res.status(err.status).json({
			message: err.message,
			errors: err.errors,
			code: err.status,
			requestId,
		})
	}

	// Handle Validation Errors
	if (err.name === 'ValidationError') {
		return res.status(400).json({
			message: 'Validation Error',
			errors: Object.values(err.errors).map(e => e.message),
			code: 400,
			requestId,
		})
	}

	// Handle MongoDB Errors
	if (err.name === 'MongoError' || err.name === 'MongoServerError') {
		return res.status(500).json({
			message: 'Database Error',
			code: 500,
			requestId,
		})
	}

	// Handle JWT Errors
	if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
		return res.status(401).json({
			message: 'Authentication Error',
			code: 401,
			requestId,
		})
	}

	// Default error
	return res.status(500).json({
		message: 'Internal Server Error',
		code: 500,
		requestId,
	})
}
