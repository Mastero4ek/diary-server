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
					user = await UserModel.findOne({ email: profile.emails[0].value })

					if (user) {
						// Link Google account to existing user
						user.google = {
							id: profile.id,
							email: profile.emails[0].value,
						}
						await user.save()
					} else {
						// Create new user
						user = await UserModel.create({
							email: profile.emails[0].value,
							name: profile.displayName,
							activation_link: uuid.v4(),
							is_activated: true,
							source: 'google',
							google: {
								id: profile.id,
								email: profile.emails[0].value,
							},
						})

						// Create empty keys document
						await KeysModel.create({
							user: user._id,
							keys: [],
						})

						// Create empty level document
						await LevelModel.create({
							user: user._id,
							level: 0,
							experience: 0,
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
