const mongoose = require('mongoose')

const URI =
	process.env.NODE_ENV === 'prod'
		? process.env.MONGO_PROD_URI
		: process.env.MONGO_DEV_URI

const greenColor = '\x1b[32m'
const redColor = '\x1b[31m'
const resetColor = '\x1b[0m'
const blueColor = '\x1b[34m'

const connectDB = async () => {
	try {
		await mongoose.connect(URI)

		console.log(
			`${greenColor}Successfully connected to MongoDB with name:${resetColor} ${blueColor}${mongoose.connection.name}${resetColor}`
		)
	} catch (error) {
		console.error(`${redColor}MongoDB connection error:${resetColor} ${error}`)

		process.exit(1)
	}
}

module.exports = connectDB
