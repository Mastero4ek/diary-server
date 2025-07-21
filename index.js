require('dotenv').config()

// TODO: req.user = {
//   id: '67c85d2b757b182ae274947b',
//   email: 'slavachirkov92@gmail.com',
//   iat: 1741190251,
//   exp: 1741192051
// }
// remove email from req.body in all routes

const app = require('./config/express')
const passport = require('./config/passport')
const connectDB = require('./config/database')
const initCronJobs = require('./config/cron')
const redis = require('./config/redis')
const mongoose = require('mongoose')
const routerGoogle = require('./routers/google')
const routerGithub = require('./routers/github')
const routerApi = require('./routers/app')
const routerTournament = require('./routers/tournament')
const routerBybit = require('./routers/bybit')
const routerOrders = require('./routers/orders')
const passportSetupGoogle = require('./passports/passportGoogle')
const passportSetupGithub = require('./passports/passportGithub')
const errorMiddleware = require('./middlewares/error-middleware')
const i18next = require('i18next')
const Backend = require('i18next-fs-backend')
const path = require('path')
const langMiddleware = require('./middlewares/lang-middleware')

// Translation files: server/locales/{ru,en}/translation.json

i18next.use(Backend).init({
	preload: ['en', 'ru'],
	fallbackLng: 'en',
	backend: {
		loadPath: path.join(__dirname, 'locales/{{lng}}/translation.json'),
	},
	interpolation: {
		escapeValue: false,
	},
})

const PORT = process.env.PORT || 5001

// Apply routes
app.use(langMiddleware)
app.use('/api', routerApi)
app.use('/auth', routerGoogle)
app.use('/auth', routerGithub)
app.use('/api', routerTournament)
app.use('/api', routerBybit)
app.use('/api', routerOrders)

// Error handling middleware
app.use(errorMiddleware)

// Health check endpoint for Coolify
app.get('/health', async (req, res) => {
	try {
		// Check MongoDB connection
		await mongoose.connection.db.admin().ping()

		// Check Redis connection
		await redis.ping()

		res.status(200).json({
			status: 'healthy',
			timestamp: new Date().toISOString(),
			services: {
				mongodb: 'connected',
				redis: 'connected',
			},
		})
	} catch (error) {
		res.status(500).json({
			status: 'unhealthy',
			timestamp: new Date().toISOString(),
			error: error.message,
		})
	}
})

// Start server
const start = async () => {
	try {
		await connectDB()
		await initCronJobs()

		app.listen(PORT, () => {
			console.log(`Successfully connected to Server on port ${PORT}!`)
		})
	} catch (e) {
		console.log(e)
	}
}

start()
