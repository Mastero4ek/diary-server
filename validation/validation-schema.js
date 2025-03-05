const ValidationSchema = {
	registration: {
		name: {
			exists: {
				errorMessage: 'Name is required',
			},
			isString: {
				errorMessage: 'Name must be a string',
			},
			trim: true,
			isLength: {
				options: { min: 2, max: 50 },
				errorMessage: 'Name must be between 2 and 50 characters',
			},
		},
		email: {
			exists: {
				errorMessage: 'Email is required',
			},
			isEmail: {
				errorMessage: 'Invalid email format',
			},
			normalizeEmail: true,
		},
		password: {
			exists: {
				errorMessage: 'Password is required',
			},
			isString: {
				errorMessage: 'Password must be a string',
			},
			isLength: {
				options: { min: 6, max: 50 },
				errorMessage: 'Password must be between 6 and 50 characters',
			},
		},
		confirm_password: {
			exists: {
				errorMessage: 'Password confirmation is required',
			},
			custom: {
				options: (value, { req }) => value === req.body.password,
				errorMessage: 'Passwords do not match',
			},
		},
		agreement: {
			exists: {
				errorMessage: 'Agreement is required',
			},
			isBoolean: {
				errorMessage: 'Agreement must be a boolean',
			},
			custom: {
				options: value => value === true,
				errorMessage: 'You must agree to the terms',
			},
		},
	},

	login: {
		email: {
			exists: {
				errorMessage: 'Email is required',
			},
			isEmail: {
				errorMessage: 'Invalid email format',
			},
			normalizeEmail: true,
		},
		password: {
			exists: {
				errorMessage: 'Password is required',
			},
			isString: {
				errorMessage: 'Password must be a string',
			},
		},
	},

	remove: {
		current_email: {
			exists: {
				errorMessage: 'Current email is required',
			},
			isEmail: {
				errorMessage: 'Invalid email format',
			},
			normalizeEmail: true,
		},
		fill_email: {
			exists: {
				errorMessage: 'Confirmation email is required',
			},
			isEmail: {
				errorMessage: 'Invalid email format',
			},
			normalizeEmail: true,
			custom: {
				options: (value, { req }) => value === req.body.current_email,
				errorMessage: 'Email addresses do not match',
			},
		},
	},

	editUser: {
		name: {
			optional: true,
			isString: {
				errorMessage: 'Name must be a string',
			},
			trim: true,
			isLength: {
				options: { min: 2, max: 50 },
				errorMessage: 'Name must be between 2 and 50 characters',
			},
		},
		email: {
			optional: true,
			isEmail: {
				errorMessage: 'Invalid email format',
			},
			normalizeEmail: true,
		},
		phone: {
			optional: true,
			isString: {
				errorMessage: 'Phone must be a string',
			},
			matches: {
				options: /^\+?[\d\s-()]+$/,
				errorMessage: 'Invalid phone number format',
			},
		},
	},

	createKeys: {
		keys: {
			isArray: {
				errorMessage: 'Keys must be an array',
			},
			custom: {
				options: value => {
					if (!Array.isArray(value)) return false
					return value.every(
						key =>
							typeof key === 'object' &&
							typeof key.name === 'string' &&
							typeof key.api === 'string' &&
							typeof key.secret === 'string'
					)
				},
				errorMessage: 'Invalid keys format',
			},
		},
	},

	tournament: {
		exchange: {
			exists: {
				errorMessage: 'Exchange is required',
			},
			isString: {
				errorMessage: 'Exchange must be a string',
			},
			isIn: {
				options: [['bybit', 'mexc', 'okx']],
				errorMessage: 'Invalid exchange',
			},
		},
		cursor: {
			optional: true,
			isString: {
				errorMessage: 'Cursor must be a string',
			},
		},
		limit: {
			optional: true,
			isInt: {
				options: { min: 1, max: 100 },
				errorMessage: 'Limit must be between 1 and 100',
			},
			toInt: true,
		},
	},

	orders: {
		email: {
			exists: {
				errorMessage: 'Email is required',
			},
			isEmail: {
				errorMessage: 'Invalid email format',
			},
			normalizeEmail: true,
		},
		exchange: {
			exists: {
				errorMessage: 'Exchange is required',
			},
			isString: {
				errorMessage: 'Exchange must be a string',
			},
			isIn: {
				options: [['bybit', 'mexc', 'okx']],
				errorMessage: 'Invalid exchange',
			},
		},
		start_time: {
			optional: true,
			isISO8601: {
				errorMessage: 'Invalid start time format',
			},
		},
		end_time: {
			optional: true,
			isISO8601: {
				errorMessage: 'Invalid end time format',
			},
		},
		page: {
			optional: true,
			isInt: {
				options: { min: 1 },
				errorMessage: 'Page must be a positive integer',
			},
			toInt: true,
		},
		limit: {
			optional: true,
			isInt: {
				options: { min: 1, max: 100 },
				errorMessage: 'Limit must be between 1 and 100',
			},
			toInt: true,
		},
	},
}

module.exports = ValidationSchema
