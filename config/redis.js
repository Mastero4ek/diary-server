const Redis = require('ioredis')

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
		console.error('Redis connection error:', err)
	})

	redis.on('connect', () => {
		console.log('Successfully connected to Redis on port 6379!')
	})
} catch (error) {
	console.error('Failed to initialize Redis:', error)
}

module.exports = redis
