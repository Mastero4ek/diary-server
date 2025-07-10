const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const UserModel = require('../models/user-model')
const KeysModel = require('../models/keys-model')
const LevelModel = require('../models/level-model')
const uuid = require('uuid')

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_ID,
			clientSecret: process.env.GOOGLE_SECRET,
			callbackURL: `${process.env.API_URL}/auth/google/callback`,
			scope: ['profile', 'email'],
		},
		async function (accessToken, refreshToken, profile, done) {
			try {
				let user = await UserModel.findOne({ 'google.id': profile.id })

				if (!user) {
					// Check if user exists with this email
					const googleEmail = profile.emails[0].value.toLowerCase()
					user = await UserModel.findOne({ email: googleEmail })

					if (user) {
						// Link Google account to existing user
						user.google = {
							id: profile.id,
							email: googleEmail,
						}
						await user.save()
					} else {
						// Create new user
						const googleEmail = profile.emails[0].value.toLowerCase()
						user = await UserModel.create({
							email: googleEmail,
							name: profile.displayName,
							activation_link: uuid.v4(),
							is_activated: true,
							change_password: false,
							source: 'google',
							google: {
								id: profile.id,
								email: googleEmail,
							},
						})

						// Create empty keys document
						await KeysModel.create({
							user: user._id,
						})

						// Create empty level document
						await LevelModel.create({
							user: user._id,
						})
					}
				}

				return done(null, user)
			} catch (error) {
				return done(error, null)
			}
		}
	)
)

module.exports = passport
