const mongoose = require('mongoose')

const URI =
	process.env.NODE_ENV === 'prod'
		? process.env.MONGO_PROD_URI
		: process.env.MONGO_DEV_URI

const connectDB = async () => {
	try {
		await mongoose.connect(URI)

		console.log('Successfully connected to MongoDB!')
	} catch (error) {
		console.error('MongoDB connection error:', error)

		process.exit(1)
	}
}

module.exports = connectDB
