const Router = require('express').Router
const router = new Router()
const passport = require('passport')
const tokenService = require('../service/token-service')
const UserDto = require('../dtos/user-dto')
const KeysDto = require('../dtos/keys-dto')
const KeysModel = require('../models/keys-model')
const LevelModel = require('../models/level-model')

router.get(
	'/github',
	passport.authenticate('github', { scope: ['user:email'] })
)

router.get(
	'/github/callback',
	passport.authenticate('github', { session: false }),
	async (req, res) => {
		try {
			const user = req.user
			const keys = await KeysModel.findOne({ user: user._id })
			const level = await LevelModel.findOne({ user: user._id })

			const userDto = new UserDto(user)
			const keysDto = new KeysDto(keys)

			const tokens = tokenService.generateTokens({ ...userDto })
			await tokenService.saveToken(userDto.id, tokens.refresh_token)

			// Set tokens as HTTP-only cookies
			res.cookie('refresh_token', tokens.refresh_token, {
				maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
			})

			res.cookie('access_token', tokens.access_token, {
				maxAge: 15 * 60 * 1000, // 15 minutes
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
			})

			// Redirect to success page without tokens in URL
			res.redirect(`${process.env.CLIENT_URL}/auth/success`)
		} catch (error) {
			console.error('GitHub auth error:', error)
			res.redirect(`${process.env.CLIENT_URL}/auth/error`)
		}
	}
)

module.exports = router
