const { ApiError } = require('../exceptions/api-error')

const fileValidation = (options = {}) => {
	return (req, res, next) => {
		if (!req.file) return next()

		const {
			allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
			maxSize = 5 * 1024 * 1024, // 5MB
			minSize = 1024, // 1KB
		} = options

		// Check file type
		if (!allowedTypes.includes(req.file.mimetype)) {
			return next(
				ApiError.BadRequest(
					`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
				)
			)
		}

		// Check file size
		if (req.file.size > maxSize) {
			return next(
				ApiError.BadRequest(
					`File too large. Maximum size allowed is ${maxSize / 1024 / 1024}MB`
				)
			)
		}

		if (req.file.size < minSize) {
			return next(
				ApiError.BadRequest(
					`File too small. Minimum size allowed is ${minSize / 1024}KB`
				)
			)
		}

		// File is valid
		next()
	}
}

module.exports = fileValidation
