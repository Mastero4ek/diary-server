const passport = require('passport')
const GitHubStrategy = require('passport-github2').Strategy
const UserModel = require('../models/user-model')
const KeysModel = require('../models/keys-model')
const LevelModel = require('../models/level-model')
const uuid = require('uuid')

passport.use(
	new GitHubStrategy(
		{
			clientID: process.env.GITHUB_ID,
			clientSecret: process.env.GITHUB_SECRET,
			callbackURL: `${process.env.API_URL}/auth/github/callback`,
			scope: ['user:email'],
		},
		async function (accessToken, refreshToken, profile, done) {
			try {
				let user = await UserModel.findOne({ 'github.id': profile.id })

				if (!user) {
					// Get primary email from GitHub profile
					const primaryEmail = profile.emails[0].value.toLowerCase()

					// Check if user exists with this email
					user = await UserModel.findOne({ email: primaryEmail })

					if (user) {
						// Link GitHub account to existing user
						user.github = {
							id: profile.id,
							email: primaryEmail,
						}
						await user.save()
					} else {
						// Create new user
						user = await UserModel.create({
							email: primaryEmail,
							name: profile.displayName || profile.username,
							activation_link: uuid.v4(),
							is_activated: true,
							change_password: false,
							source: 'github',
							github: {
								id: profile.id,
								email: primaryEmail,
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
