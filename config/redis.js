const Redis = require('ioredis')

const greenColor = '\x1b[32m'
const redColor = '\x1b[31m'
const resetColor = '\x1b[0m'
const blueColor = '\x1b[34m'

// Initialize Redis
let redis = null

try {
	redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
		retryStrategy: function (times) {
			const delay = Math.min(times * 50, 2000)

			return delay
		},
		maxRetriesPerRequest: 3,
	})

	redis.on('error', err => {
		console.error(`${redColor}Redis connection error:${resetColor} ${err}`)
	})

	redis.on('connect', () => {
		console.log(
			`${greenColor}Successfully connected to Redis on port:${resetColor} ${blueColor}6379${resetColor}`
		)
	})
} catch (error) {
	console.error(`${redColor}Failed to initialize Redis:${resetColor} ${error}`)
}

module.exports = redis
