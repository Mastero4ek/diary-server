require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')

const connectDB = require('./config/database')
const User = require('./models/user-model')
const Keys = require('./models/keys-model')
const Level = require('./models/level-model')

async function seedUser() {
	await connectDB()

	const email = 'slavachirkov92@gmail.com'
	const password = 'qwerty'
	const name = 'Test'
	const last_name = 'User'
	const phone = 1234567890

	const existing = await User.findOne({ email })
	if (existing) {
		console.log('User already exists:', email)
		mongoose.disconnect()
		return
	}

	const salt = await bcrypt.genSalt(10)
	const hashedPassword = await bcrypt.hash(password, salt)

	const activation_link = uuidv4()
	const user = await User.create({
		name,
		last_name,
		email,
		password: hashedPassword,
		activation_link,
		source: 'seeder',
		is_activated: true,
		change_password: false,
		phone,
		cover: null,
		created_at: new Date(),
		updated_at: new Date(),
	})
	console.log('User created:', user._id)

	const keys = await Keys.create({ user: user._id })
	console.log('Keys created:', keys._id)

	const level = await Level.create({ user: user._id })
	console.log('Level created:', level._id)

	mongoose.disconnect()
	console.log('Seeding completed!')
}

seedUser().catch(err => {
	console.error('Seeding error:', err)
	mongoose.disconnect()
})
