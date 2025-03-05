const passport = require('passport')
const UserModel = require('../models/user-model')

// Initialize passport
passport.initialize()
passport.session()

// Serialize user for the session
passport.serializeUser((user, done) => {
	done(null, user)
})

// Deserialize user from the session
passport.deserializeUser(async (user, done) => {
	try {
		let currentUser = {}

		if (user.provider === 'google') {
			currentUser = await UserModel.findOne({ email: user._json.email })
		} else if (user.provider === 'github') {
			currentUser = await UserModel.findOne({
				email: user.emails[0].value.toLowerCase(),
			})
		}

		done(null, currentUser)
	} catch (err) {
		done(err)
	}
})

module.exports = passport
