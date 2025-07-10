const i18next = require('i18next')

const ValidationSchema = {
	registration: {
		name: {
			exists: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.name.required', { lng: req.lng }),
			},
			isString: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.name.string', { lng: req.lng }),
			},
			trim: true,
			isLength: {
				options: { min: 2, max: 50 },
				errorMessage: (value, { req }) =>
					i18next.t('validation.name.length', { lng: req.lng }),
			},
		},
		email: {
			exists: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.email.required', { lng: req.lng }),
			},
			isEmail: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.email.invalid', { lng: req.lng }),
			},
			normalizeEmail: true,
		},
		password: {
			exists: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.password.required', { lng: req.lng }),
			},
			isString: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.password.string', { lng: req.lng }),
			},
			isLength: {
				options: { min: 6, max: 50 },
				errorMessage: (value, { req }) =>
					i18next.t('validation.password.length', { lng: req.lng }),
			},
			optional: {
				options: ({ req }) => req.body.source && req.body.source !== 'local',
			},
		},
		confirm_password: {
			exists: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.confirm_password.required', { lng: req.lng }),
			},
			custom: {
				options: (value, { req }) => value === req.body.password,
				errorMessage: (value, { req }) =>
					i18next.t('validation.confirm_password.mismatch', { lng: req.lng }),
			},
			optional: {
				options: ({ req }) => req.body.source && req.body.source !== 'local',
			},
		},
		agreement: {
			exists: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.agreement.required', { lng: req.lng }),
			},
			isBoolean: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.agreement.boolean', { lng: req.lng }),
			},
			custom: {
				options: value => value === true,
				errorMessage: (value, { req }) =>
					i18next.t('validation.agreement.must_agree', { lng: req.lng }),
			},
		},
	},

	login: {
		email: {
			exists: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.email.required', { lng: req.lng }),
			},
			isEmail: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.email.invalid', { lng: req.lng }),
			},
			normalizeEmail: true,
		},
		password: {
			exists: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.password.required', { lng: req.lng }),
			},
			isString: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.password.string', { lng: req.lng }),
			},
		},
	},

	remove: {
		current_email: {
			exists: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.current_email.required', { lng: req.lng }),
			},
			isEmail: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.current_email.invalid', { lng: req.lng }),
			},
			normalizeEmail: true,
		},
		fill_email: {
			exists: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.fill_email.required', { lng: req.lng }),
			},
			isEmail: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.fill_email.invalid', { lng: req.lng }),
			},
			normalizeEmail: true,
			custom: {
				options: (value, { req }) => value === req.body.current_email,
				errorMessage: (value, { req }) =>
					i18next.t('validation.fill_email.mismatch', { lng: req.lng }),
			},
		},
	},

	editUser: {
		name: {
			optional: true,
			isString: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.name.string', { lng: req.lng }),
			},
			trim: true,
			isLength: {
				options: { min: 2, max: 50 },
				errorMessage: (value, { req }) =>
					i18next.t('validation.name.length', { lng: req.lng }),
			},
		},
		email: {
			optional: true,
			isEmail: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.email.invalid', { lng: req.lng }),
			},
			normalizeEmail: true,
		},
		phone: {
			optional: true,
			isString: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.phone.string', { lng: req.lng }),
			},
			matches: {
				options: /^\+?[\d\s-()]+$/,
				errorMessage: (value, { req }) =>
					i18next.t('validation.phone.invalid', { lng: req.lng }),
			},
		},
	},

	createKeys: {
		keys: {
			isArray: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.keys.array', { lng: req.lng }),
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
				errorMessage: (value, { req }) =>
					i18next.t('validation.keys.invalid', { lng: req.lng }),
			},
		},
	},

	tournament: {
		exchange: {
			exists: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.exchange.required', { lng: req.lng }),
			},
			isString: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.exchange.string', { lng: req.lng }),
			},
			isIn: {
				options: [['bybit', 'mexc', 'okx']],
				errorMessage: (value, { req }) =>
					i18next.t('validation.exchange.invalid', { lng: req.lng }),
			},
		},
		cursor: {
			optional: true,
			isString: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.cursor.string', { lng: req.lng }),
			},
		},
		limit: {
			optional: true,
			isInt: {
				options: { min: 1, max: 100 },
				errorMessage: (value, { req }) =>
					i18next.t('validation.limit.invalid', { lng: req.lng }),
			},
			toInt: true,
		},
	},

	orders: {
		exchange: {
			exists: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.exchange.required', { lng: req.lng }),
			},
			isString: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.exchange.string', { lng: req.lng }),
			},
			isIn: {
				options: [['bybit', 'mexc', 'okx']],
				errorMessage: (value, { req }) =>
					i18next.t('validation.exchange.invalid', { lng: req.lng }),
			},
		},
		start_time: {
			optional: true,
			isISO8601: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.start_time.invalid', { lng: req.lng }),
			},
		},
		end_time: {
			optional: true,
			isISO8601: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.end_time.invalid', { lng: req.lng }),
			},
		},
		page: {
			optional: true,
			isInt: {
				options: { min: 1 },
				errorMessage: (value, { req }) =>
					i18next.t('validation.page.invalid', { lng: req.lng }),
			},
			toInt: true,
		},
		limit: {
			optional: true,
			isInt: {
				options: { min: 1, max: 100 },
				errorMessage: (value, { req }) =>
					i18next.t('validation.limit.invalid', { lng: req.lng }),
			},
			toInt: true,
		},
	},

	wallet: {
		exchange: {
			exists: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.exchange.required', { lng: req.lng }),
			},
			isString: {
				errorMessage: (value, { req }) =>
					i18next.t('validation.exchange.string', { lng: req.lng }),
			},
			isIn: {
				options: [['bybit', 'mexc', 'okx']],
				errorMessage: (value, { req }) =>
					i18next.t('validation.exchange.invalid', { lng: req.lng }),
			},
		},
	},
}

module.exports = ValidationSchema
