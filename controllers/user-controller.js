const userService = require('../service/user-service')
const { validationResult } = require('express-validator')
const ApiError = require('../exceptions/api-error')
const UserModel = require('../models/user-model')
const fileService = require('../service/file-service')
const tokenService = require('../service/token-service')
const keysService = require('../service/keys-service')

class UserController {
	async signUp(req, res, next) {
		try {
			const errors = validationResult(req)
			const { name, email, password } = req.body
			const { language } = req.cookies

			if (!errors.isEmpty()) {
				return next(
					ApiError.BadRequest(
						language === 'ru' ? 'Ошибка при валидации!' : 'Validation error!',
						errors.array()
					)
				)
			}

			const user_data = await userService.signUp(
				name,
				email,
				password,
				language
			)

			res.cookie('refresh_token', user_data.refresh_token, {
				maxAge: 30 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			})

			return res.json(user_data)
		} catch (e) {
			next(e)
		}
	}

	async signIn(req, res, next) {
		try {
			const errors = validationResult(req)
			const { email, password } = req.body
			const { language } = req.cookies

			if (!errors.isEmpty()) {
				return next(
					ApiError.BadRequest(
						language === 'ru' ? 'Ошибка при валидации!' : 'Validation error!',
						errors.array()
					)
				)
			}

			const user_data = await userService.signIn(email, password, language)

			res.cookie('refresh_token', user_data.refresh_token, {
				maxAge: 30 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			})

			return res.json(user_data)
		} catch (e) {
			next(e)
		}
	}

	async logout(req, res, next) {
		try {
			const { refresh_token } = req.cookies
			await userService.logout(refresh_token)

			req.session.destroy(err => {
				if (err) {
					return next(err)
				}

				res.clearCookie('refresh_token')
				res.clearCookie('access_token')

				return res.json({ message: 'Logged out successfully' })
			})
		} catch (e) {
			next(e)
		}
	}

	async refresh(req, res, next) {
		try {
			const { refresh_token: existing_refresh_token } = req.cookies
			const user = req.user

			let user_data = {}

			if (user && (user.source === 'github' || user.source === 'google')) {
				user_data = await userService.checkSourceAuth(user.email)
			} else if (existing_refresh_token && !user) {
				user_data = await userService.refresh(existing_refresh_token)
			} else {
				return res.json({})
			}

			// Set both tokens as HTTP-only cookies
			res.cookie('refresh_token', user_data.refresh_token, {
				maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
			})

			res.cookie('access_token', user_data.access_token, {
				maxAge: 15 * 60 * 1000, // 15 minutes
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
			})

			// Remove tokens from response data for security
			const { access_token, refresh_token, ...user_data_safe } = user_data
			return res.json(user_data_safe)
		} catch (e) {
			next(e)
		}
	}

	async activate(req, res, next) {
		try {
			const activation_link = req.params.link
			const user_data = await userService.activate(activation_link)

			if (!user_data || !user_data.user) {
				throw ApiError.InternalError('Failed to get user data after activation')
			}

			// Set both tokens as HTTP-only cookies with proper configuration
			res.cookie('refresh_token', user_data.refresh_token, {
				maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax', // Important for cross-site redirects
				path: '/',
				domain:
					process.env.NODE_ENV === 'production'
						? process.env.DOMAIN
						: 'localhost',
			})

			res.cookie('access_token', user_data.access_token, {
				maxAge: 15 * 60 * 1000, // 15 minutes
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax', // Important for cross-site redirects
				path: '/',
				domain:
					process.env.NODE_ENV === 'production'
						? process.env.DOMAIN
						: 'localhost',
			})

			// Remove tokens from response data for security
			const { access_token, refresh_token, ...user_data_safe } = user_data

			// Redirect to dashboard with user data
			return res.redirect(
				`${process.env.CLIENT_URL}/dashboard?user=${encodeURIComponent(
					JSON.stringify({ user: user_data_safe.user })
				)}`
			)
		} catch (e) {
			next(e)
		}
	}

	async editUser(req, res, next) {
		try {
			const { name, last_name, email, password, phone } = req.body
			const cover = req.file
			const { language } = req.cookies
			const user = req.user // Get the authenticated user from the request

			if (!user) {
				return next(ApiError.UnauthorizedError())
			}

			// Handle file upload if there's a cover
			if (cover) {
				const existingUser = await UserModel.findById(user.id)

				if (existingUser.cover) {
					const last_slash_index = existingUser.cover.lastIndexOf('/')
					const file_name = existingUser.cover.substring(last_slash_index + 1)

					await fileService.removeCover(file_name, existingUser.email, language)
				}

				await fileService.uploadCover(cover, existingUser.email, language)
			}

			// Update user data
			const user_data = await userService.editUser(
				name || '',
				last_name || '',
				email || user.email, // Use current email if not provided
				password || '',
				phone || null
			)

			return res.json(user_data)
		} catch (e) {
			next(e)
		}
	}

	async removeUser(req, res, next) {
		try {
			const errors = validationResult(req)
			const { current_email, fill_email } = req.body
			const { refresh_token, language } = req.cookies
			const current_user = await UserModel.findOne({ email: current_email })

			if (current_user && current_user.email !== fill_email) {
				return next(
					ApiError.BadRequest(
						language === 'ru'
							? 'Введённый Email-адрес не совпадает с Email-адресом аккаунта!'
							: 'The email address you entered does not match your account email address!',
						errors.array()
					)
				)
			}

			if (!errors.isEmpty()) {
				return next(
					ApiError.BadRequest(
						language === 'ru' ? 'Ошибка при валидации!' : 'Validation error!',
						errors.array()
					)
				)
			}

			if (current_user.cover) {
				const last_slash_index = current_user.cover.lastIndexOf('/')
				const file_name = current_user.cover.substring(last_slash_index + 1)

				await fileService.removeCover(file_name, current_email, language)
			}

			await tokenService.removeToken(refresh_token)
			await keysService.removeKeys(current_email, language)
			await userService.removeUser(current_email, refresh_token)

			req.session.destroy(err => {
				if (err) {
					return next(err)
				}

				res.clearCookie('refresh_token')
				res.clearCookie('access_token')

				return res.json({ message: 'User removed out successfully' })
			})
		} catch (e) {
			next(e)
		}
	}

	async verifyTempToken(req, res, next) {
		try {
			const { token } = req.body
			if (!token) {
				return next(ApiError.BadRequest('Token is required'))
			}

			const isValid = tokenService.validateAccessToken(token)

			return res.json({ valid: !!isValid })
		} catch (e) {
			next(e)
		}
	}
}

module.exports = new UserController()
