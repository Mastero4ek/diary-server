const UserModel = require('../models/user-model')
const KeysModel = require('../models/keys-model')
const FileModel = require('../models/file-model')
const TokenModel = require('../models/token-model')
const LevelModel = require('../models/level-model')
const bcrypt = require('bcrypt')
const uuid = require('uuid')
const tokenService = require('./token-service')
const mailService = require('./mail-service')
const UserDto = require('../dtos/user-dto')
const KeysDto = require('../dtos/keys-dto')
const { ApiError, localizedError } = require('../exceptions/api-error')
const moment = require('moment')
const OrderModel = require('../models/order-model')
const i18next = require('i18next')

class UserService {
	async signUp(name, email, password, lng, source = 'local') {
		try {
			// Check if user already exists
			const normalizedEmail = email.toLowerCase()
			const existingUser = await UserModel.findOne({ email: normalizedEmail })
			if (existingUser) {
				throw ApiError.BadRequest(i18next.t('errors.email_exists', { lng }))
			}

			let hashedPassword = undefined
			if (source === 'local') {
				// Hash password
				const salt = await bcrypt.genSalt(10)
				hashedPassword = await bcrypt.hash(password, salt)
			}

			// Create activation link
			const activation_link = uuid.v4()

			// Create user
			const user = await UserModel.create({
				name,
				email: normalizedEmail,
				...(source === 'local' ? { password: hashedPassword } : {}),
				activation_link,
				source,
				updated_at: new Date(),
				created_at: new Date(),
			})

			// Create associated data
			const keys = await KeysModel.create({ user: user._id })
			const level = await LevelModel.create({ user: user._id })

			// Send activation email
			await mailService.sendActivationMail(
				name,
				email,
				lng,
				`${process.env.API_URL}/api/activate/${activation_link}`
			)

			// Generate tokens
			const user_dto = new UserDto(user)

			const tokens = await tokenService.generateTokens({
				id: user._id.toString(),
				email: user.email,
			})

			if (!tokens || !tokens.refresh_token) {
				throw ApiError.InternalError(
					i18next.t('errors.failed_generate_tokens', { lng })
				)
			}

			// Save refresh token
			await tokenService.saveToken(user_dto.id, tokens.refresh_token)

			return {
				...tokens,
				user: { ...user_dto, ...new KeysDto(keys), level: level.level },
			}
		} catch (error) {
			console.error('Signup error:', error)

			// If it's already an ApiError, rethrow it
			if (error instanceof ApiError) {
				throw error
			}

			// Clean up if user was created but later steps failed
			if (error.message.includes('token') && email) {
				try {
					const user = await UserModel.findOne({ email })
					if (user) {
						await Promise.all([
							UserModel.deleteOne({ _id: user._id }),
							KeysModel.deleteOne({ user: user._id }),
							LevelModel.deleteOne({ user: user._id }),
						])
					}
				} catch (cleanupError) {
					console.error('Cleanup error:', cleanupError)
				}
			}

			throw ApiError.InternalError(
				i18next.t('errors.failed_create_user', { lng })
			)
		}
	}

	async signIn(email, password, lng) {
		try {
			// Find user
			const normalizedEmail = email.toLowerCase()
			const user = await UserModel.findOne({ email: normalizedEmail })
			if (!user) {
				throw ApiError.UnauthorizedError(
					i18next.t('errors.user_not_found', { lng })
				)
			}

			// Check if user is activated
			if (!user.is_activated) {
				throw ApiError.UnauthorizedError(
					i18next.t('errors.activate_account_first', { lng })
				)
			}

			// Verify password
			const isPasswordValid = await bcrypt.compare(password, user.password)
			if (!isPasswordValid) {
				throw ApiError.UnauthorizedError(
					i18next.t('errors.invalid_email_or_password', { lng })
				)
			}

			// Update last login
			user.updated_at = new Date()
			await user.save()

			// Get associated data
			const keys = await KeysModel.findOne({ user: user._id })
			const level = await LevelModel.findOne({ user: user._id })

			if (!keys || !level) {
				throw ApiError.InternalError(
					i18next.t('errors.user_data_incomplete', { lng })
				)
			}

			// Generate tokens
			const user_dto = new UserDto(user)
			const tokens = await tokenService.generateTokens({
				id: user._id.toString(),
				email: user.email,
			})

			if (!tokens || !tokens.refresh_token) {
				throw ApiError.InternalError(
					i18next.t('errors.failed_generate_tokens', { lng })
				)
			}

			await tokenService.saveToken(user._id.toString(), tokens.refresh_token)

			return {
				...tokens,
				user: { ...user_dto, ...new KeysDto(keys), level: level.level },
			}
		} catch (error) {
			if (error instanceof ApiError) {
				throw error
			}
			throw ApiError.InternalError(i18next.t('errors.failed_sign_in', { lng }))
		}
	}

	async checkSourceAuth(email) {
		try {
			const normalizedEmail = email.toLowerCase()
			const user = await UserModel.findOne({ email: normalizedEmail })
			if (!user) {
				throw ApiError.UnauthorizedError('User not found')
			}

			// Update last login
			user.updated_at = new Date()
			await user.save()

			// Get associated data
			const keys = await KeysModel.findOne({ user: user._id })
			const level = await LevelModel.findOne({ user: user._id })

			if (!keys || !level) {
				throw ApiError.InternalError('User data incomplete')
			}

			// Generate tokens
			const user_dto = new UserDto(user)
			const tokens = await tokenService.generateTokens({
				id: user._id.toString(),
				email: user.email,
			})

			if (!tokens || !tokens.refresh_token) {
				throw ApiError.InternalError('Failed to generate authentication tokens')
			}

			await tokenService.saveToken(user._id.toString(), tokens.refresh_token)

			return {
				...tokens,
				user: { ...user_dto, ...new KeysDto(keys), level: level.level },
			}
		} catch (error) {
			if (error instanceof ApiError) {
				throw error
			}
			throw ApiError.InternalError('Failed to authenticate with source')
		}
	}

	async logout(refresh_token) {
		try {
			if (!refresh_token) {
				throw ApiError.UnauthorizedError('No refresh token provided')
			}
			return await tokenService.removeToken(refresh_token)
		} catch (error) {
			if (error instanceof ApiError) {
				throw error
			}
			throw ApiError.InternalError('Failed to logout')
		}
	}

	async refresh(refresh_token) {
		try {
			if (!refresh_token) {
				throw ApiError.UnauthorizedError('No refresh token provided')
			}

			// Validate refresh token
			const user_data = tokenService.validateRefreshToken(refresh_token)
			if (!user_data || !user_data.id) {
				throw ApiError.UnauthorizedError('Invalid refresh token')
			}

			// Find token in database
			const token_data = await tokenService.findToken(refresh_token)
			if (!token_data) {
				throw ApiError.UnauthorizedError('Refresh token not found')
			}

			// Get user and associated data
			const user = await UserModel.findById(user_data.id)
			if (!user) {
				throw ApiError.UnauthorizedError('User not found')
			}

			// Update last login
			user.updated_at = new Date()
			await user.save()

			const keys = await KeysModel.findOne({ user: user._id })
			const level = await LevelModel.findOne({ user: user._id })

			if (!keys || !level) {
				throw ApiError.InternalError('User data incomplete')
			}

			// Generate new tokens
			const user_dto = new UserDto(user)
			const tokens = await tokenService.generateTokens({
				id: user._id.toString(),
				email: user.email,
			})

			if (!tokens || !tokens.refresh_token) {
				throw ApiError.InternalError('Failed to generate authentication tokens')
			}

			// Save the refresh token
			await tokenService.saveToken(user._id.toString(), tokens.refresh_token)

			return {
				...tokens,
				user: { ...user_dto, ...new KeysDto(keys), level: level.level },
			}
		} catch (error) {
			if (error instanceof ApiError) {
				throw error
			}
			throw ApiError.InternalError('Failed to refresh token')
		}
	}

	async activate(activation_link) {
		try {
			if (!activation_link) {
				throw ApiError.BadRequest(
					i18next.t('errors.activation_link_required', { lng: 'en' })
				)
			}

			const user = await UserModel.findOne({ activation_link })
			if (!user) {
				throw ApiError.BadRequest(
					i18next.t('errors.invalid_activation_link', { lng: 'en' })
				)
			}

			if (user.is_activated) {
				throw ApiError.BadRequest(
					i18next.t('errors.account_already_activated', { lng: 'en' })
				)
			}

			// Check if activation link is expired (24 hours)
			const activationExpiry = moment(user.created_at).add(24, 'hours')
			if (moment().isAfter(activationExpiry)) {
				// Generate new activation link
				const new_activation_link = uuid.v4()
				user.activation_link = new_activation_link
				await user.save()

				// Send new activation email
				await mailService.sendActivationMail(
					user.name,
					user.email,
					'en', // Default to English for expired links
					`${process.env.API_URL}/api/activate/${new_activation_link}`
				)

				throw ApiError.BadRequest(
					i18next.t('errors.activation_link_expired', { lng: 'en' })
				)
			}

			// Activate user first
			user.is_activated = true
			user.activation_link = undefined
			user.updated_at = new Date()
			await user.save()

			// Get associated data
			const [keys, level] = await Promise.all([
				KeysModel.findOne({ user: user._id }),
				LevelModel.findOne({ user: user._id }),
			])

			if (!keys || !level) {
				throw ApiError.InternalError('User data incomplete')
			}

			// Generate tokens
			const user_dto = new UserDto(user)
			const tokens = await tokenService.generateTokens({
				id: user._id.toString(),
				email: user.email,
			})

			// Ensure we have a refresh token before trying to save it
			if (!tokens || !tokens.refresh_token) {
				throw ApiError.InternalError('Failed to generate authentication tokens')
			}

			// Save the refresh token
			await tokenService.saveToken(user._id.toString(), tokens.refresh_token)

			return {
				...tokens,
				user: { ...user_dto, ...new KeysDto(keys), level: level.level },
			}
		} catch (error) {
			if (error instanceof ApiError) {
				throw error
			}
			console.error('Activation error:', error)
			throw ApiError.InternalError(
				i18next.t('errors.failed_activate_account', { lng })
			)
		}
	}

	async editUser(name, last_name, email, password, phone) {
		const user = await UserModel.findOne({ email })
		const hashPassword = await bcrypt.hash(password, 3)

		if (!user) return {}

		const new_user = await UserModel.findOneAndUpdate(
			{ email: user.email },
			{
				$set: {
					name: name === '' ? user.name : name,
					last_name: last_name,
					password: password === '' ? user.password : hashPassword,
					change_password: password === '' ? user.change_password : true,
					phone: phone === 'null' ? user.phone : phone,
					updated_at: new Date(),
				},
			},
			{ returnDocument: 'after' }
		)

		if (!new_user) return {}

		const keys = await KeysModel.findOne({ user: user._id })
		const level = await LevelModel.findOne({ user: user._id })

		const keys_dto = new KeysDto(keys)
		const user_dto = new UserDto(new_user)

		return { user: { ...user_dto, ...keys_dto, level: level.level } }
	}

	async removeUser(current_email, refresh_token) {
		const user = await UserModel.findOneAndDelete({ email: current_email })
		await KeysModel.findOneAndDelete({ user: user._id })
		await LevelModel.findOneAndDelete({ user: user._id })
		await tokenService.removeToken(refresh_token)

		if (user.cover) {
			await FileModel.findOneAndDelete({ user: user._id })
		}

		return { user }
	}

	async deleteInactiveUsers() {
		const twenty_four_hours_ago = moment().subtract(24, 'hours').toDate()

		try {
			const users = await UserModel.find({
				is_activated: false,
				created_at: { $lt: twenty_four_hours_ago },
			})

			let deletedCount = 0

			for (const user of users) {
				try {
					// Delete all related data
					await Promise.all([
						FileModel.deleteMany({ user: user._id }),
						KeysModel.deleteMany({ user: user._id }),
						LevelModel.deleteMany({ user: user._id }),
						TokenModel.deleteMany({ user: user._id }),
						OrderModel.deleteMany({ user: user._id }),
						user.deleteOne(),
					])
					deletedCount++
				} catch (err) {
					console.error(`Failed to delete user ${user.email}:`, err)
				}
			}

			const formatDate = date => {
				return moment(date).format('DD.MM.YYYY - HH:mm:ss')
			}

			const blueColor = '\x1b[34m'
			const redColor = '\x1b[31m'
			const resetColor = '\x1b[0m'

			console.log(`${blueColor}${formatDate(new Date())}${resetColor}`)
			console.log(
				`${redColor}Deleted inactive users: ${deletedCount}${resetColor}`
			)

			return deletedCount
		} catch (err) {
			console.error('Error in deleteInactiveUsers:', err)
			throw err
		}
	}

	async getUser(userId) {
		try {
			const user = await UserModel.findById(userId)
			if (!user) {
				throw ApiError.NotFound('User not found')
			}

			const keys = await KeysModel.findOne({ user: user._id })
			const level = await LevelModel.findOne({ user: user._id })

			if (!keys || !level) {
				throw ApiError.InternalError('User data incomplete')
			}

			const user_dto = new UserDto(user)
			return { ...user_dto, ...new KeysDto(keys), level: level.level }
		} catch (error) {
			if (error instanceof ApiError) {
				throw error
			}
			throw ApiError.InternalError('Failed to get user data')
		}
	}

	async updateUserData(userId, updateData) {
		try {
			const user = await UserModel.findByIdAndUpdate(
				userId,
				{ ...updateData, updated_at: new Date() },
				{ new: true }
			)
			if (!user) {
				throw ApiError.NotFound('User not found')
			}
			return new UserDto(user)
		} catch (error) {
			if (error instanceof ApiError) {
				throw error
			}
			throw ApiError.InternalError('Failed to update user data')
		}
	}
}

module.exports = new UserService()
