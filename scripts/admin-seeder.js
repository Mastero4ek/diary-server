require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')

const connectDB = require('../config/database')
const User = require('../models/user-model')
const Keys = require('../models/keys-model')
const Level = require('../models/level-model')

const greenColor = '\x1b[32m'
const redColor = '\x1b[31m'
const resetColor = '\x1b[0m'
const blueColor = '\x1b[34m'

async function seedUser() {
	await connectDB()

	const email = 'slavachirkov92@gmail.com'
	const role = 'admin'
	const password = '123456'
	const name = 'Admin'
	const last_name = 'Admin'
	const phone = 1234567890

	const existing = await User.findOne({ email })
	if (existing) {
		console.log(
			`${redColor}User already exists:${resetColor} ${blueColor}${email}${resetColor}`
		)

		mongoose.disconnect()
		return
	}

	const salt = await bcrypt.genSalt(10)
	const hashedPassword = await bcrypt.hash(password, salt)

	const activation_link = uuidv4()
	const user = await User.create({
		name,
		role,
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
	console.log(
		`${greenColor}User created:${resetColor} ${blueColor}${user._id}${resetColor}`
	)

	const keys = await Keys.create({ user: user._id })
	console.log(
		`${greenColor}Keys created:${resetColor} ${blueColor}${keys._id}${resetColor}`
	)
	const level = await Level.create({ user: user._id })
	console.log(
		`${greenColor}Level created:${resetColor} ${blueColor}${level._id}${resetColor}`
	)

	mongoose.disconnect()
	console.log(`${greenColor}Seeding completed!${resetColor}`)
}

seedUser().catch(err => {
	console.error(`${redColor}Seeding error:${resetColor} ${err}`)
})
