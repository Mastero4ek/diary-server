const { RestClientV5 } = require('bybit-api')
const moment = require('moment')
const BybitOrderDto = require('../dtos/bybit-order-dto')
const redis = require('../config/redis')
const KeysService = require('./keys-service')
const { ApiError } = require('../exceptions/api-error')
const i18next = require('i18next')

class BybitService {
	async getBybitOrdersPnl(language, keys, start_time, end_time) {
		// Генерировать ключ кэша на основе пользователя и временного диапазона.
		const cacheKey = `bybit_pnl:${keys.api}:${start_time}:${end_time}`

		// Попробуйте получить данные из кеша, если Redis доступен.
		if (redis) {
			try {
				const cachedData = await redis.get(cacheKey)

				if (cachedData) {
					return JSON.parse(cachedData)
				}
			} catch (error) {
				console.error('Redis cache read error:', error)
				// Продолжить без кеша, если возникла ошибка
			}
		}

		const client = new RestClientV5({
			testnet: false,
			key: keys.api,
			secret: keys.secret,
		})

		const startTime = moment(start_time)
		const endTime = moment(end_time)
		const diffDays = endTime.diff(startTime, 'days')

		let allOrders = []

		if (diffDays > 7) {
			// Разбиваем диапазон на отрезки по 7 дней
			const timeChunks = []
			let currentStartTime = startTime.clone()
			const endLimit = endTime.clone()

			while (currentStartTime.isBefore(endLimit)) {
				const currentEndTime = moment.min(
					currentStartTime.clone().add(7, 'days'),
					endLimit
				)

				timeChunks.push({
					start: currentStartTime.unix() * 1000,
					end: currentEndTime.unix() * 1000,
				})

				currentStartTime = currentEndTime
			}

			// Обрабатываем все отрезки параллельно
			const chunkResults = await Promise.all(
				timeChunks.map(async chunk => {
					let chunkOrders = []
					let nextCursor = ''

					do {
						const response = await client.getClosedPnL({
							category: 'linear',
							startTime: chunk.start,
							endTime: chunk.end,
							cursor: nextCursor || undefined,
							limit: 50, // Добавьте ограничение для контроля записей на запрос
						})

						if (response.result.list && response.result.list.length > 0) {
							chunkOrders = [...chunkOrders, ...response.result.list]
						}

						nextCursor = response.result.nextPageCursor
						// Добавьте небольшую задержку, чтобы избежать ограничений по скорости
						await new Promise(resolve => setTimeout(resolve, 50))
					} while (nextCursor)

					return chunkOrders
				})
			)

			// Объедините результаты из всех отрезков
			allOrders = chunkResults.flat()
		} else {
			let nextCursor = ''

			do {
				const response = await client.getClosedPnL({
					category: 'linear',
					startTime: start_time,
					endTime: end_time,
					cursor: nextCursor || undefined,
					limit: 50, // Добавьте ограничение для контроля записей на запрос
				})

				if (response.result.list && response.result.list.length > 0) {
					allOrders = [...allOrders, ...response.result.list]
				}

				nextCursor = response.result.nextPageCursor
				// Добавьте небольшую задержку, чтобы избежать ограничений по скорости
				await new Promise(resolve => setTimeout(resolve, 50))
			} while (nextCursor)
		}

		const orders = allOrders.map(item => new BybitOrderDto(item))

		// Кэшируйте результаты, если Redis доступен
		if (redis) {
			try {
				await redis.setex(cacheKey, 300, JSON.stringify(orders))
			} catch (error) {
				console.error('Redis cache write error:', error)
				// Продолжить без кэширования, если возникла ошибка
			}
		}

		return orders
	}

	async getBybitTickers(language, keys) {
		// Generate cache key based on API key
		const cacheKey = `bybit_tickers:${keys.api}`

		// Try to get data from cache if Redis is available
		if (redis) {
			try {
				const cachedData = await redis.get(cacheKey)

				if (cachedData) {
					return JSON.parse(cachedData)
				}
			} catch (error) {
				console.error('Redis cache read error:', error)
				// Continue without cache if there's an error
			}
		}

		const client = new RestClientV5({
			testnet: false,
			key: keys.api,
			secret: keys.secret,
		})

		let tickers = []

		const response = await client.getTickers({ category: 'linear' })

		if (response.result.list && response.result.list.length > 0) {
			tickers = [...response.result.list]
		}

		// Cache the results if Redis is available
		if (redis) {
			try {
				await redis.setex(cacheKey, 60, JSON.stringify(tickers)) // Cache for 1 minute
			} catch (error) {
				console.error('Redis cache write error:', error)
				// Continue without caching if there's an error
			}
		}

		return tickers
	}

	async getBybitWallet(language, keys) {
		// Generate cache key based on API key
		const cacheKey = `bybit_wallet:${keys.api}`

		// Try to get data from cache if Redis is available
		if (redis) {
			try {
				const cachedData = await redis.get(cacheKey)

				if (cachedData) {
					return JSON.parse(cachedData)
				}
			} catch (error) {
				console.error('Redis cache read error:', error)
				// Continue without cache if there's an error
			}
		}

		const client = new RestClientV5({
			testnet: false,
			key: keys.api,
			secret: keys.secret,
		})

		let wallet = {}

		const response = await client.getWalletBalance({ accountType: 'UNIFIED' })

		if (response.result.list && response.result.list[0].coin) {
			const usdt = response.result.list[0].coin.find(
				item => item.coin === 'USDT'
			)

			wallet.total_balance = Number(usdt.walletBalance).toFixed(4)
			wallet.unrealised_pnl = Number(usdt.unrealisedPnl).toFixed(4)
		}

		// Cache the results if Redis is available
		if (redis) {
			try {
				await redis.setex(cacheKey, 60, JSON.stringify(wallet)) // Cache for 1 minute
			} catch (error) {
				console.error('Redis cache write error:', error)
				// Continue without caching if there's an error
			}
		}

		return wallet
	}

	async getBybitPositions(language, keys) {
		// Генерировать ключ кэша на основе пользователя и временного диапазона.
		const cacheKey = `bybit_positions:${keys.api}:${new Date().toISOString()}`

		// Попробуйте получить данные из кеша, если Redis доступен.
		if (redis) {
			try {
				const cachedData = await redis.get(cacheKey)

				if (cachedData) {
					return JSON.parse(cachedData)
				}
			} catch (error) {
				console.error('Redis cache read error:', error)
				// Продолжить без кеша, если возникла ошибка
			}
		}

		const client = new RestClientV5({
			testnet: false,
			key: keys.api,
			secret: keys.secret,
		})

		let allPositions = []

		const response = await client.getPositionInfo({
			category: 'linear', //'spot' | 'linear' | 'inverse' | 'option'
			settleCoin: 'USDT',
			// symbol: 'BTCUSDT',
			//необязательные параметры
			// baseCoin: string,
			// limit: number,
			// cursor: string,
		})

		if (response.result.list && response.result.list.length > 0) {
			allPositions = [...allPositions, ...response.result.list]
		}

		// Добавляем логику для обработки пагинации
		while (response.result.nextPageCursor !== '') {
			const nextResponse = await client.getPositionInfo({
				category: 'linear',
				settleCoin: 'USDT',
				cursor: response.result.nextPageCursor,
			})

			if (nextResponse.result.list && nextResponse.result.list.length > 0) {
				allPositions = [...allPositions, ...nextResponse.result.list]
			}

			response.result.nextPageCursor = nextResponse.result.nextPageCursor
		}

		const orders = allPositions.map(item => new BybitOrderDto(item))

		// Кэшируйте результаты, если Redis доступен
		if (redis) {
			try {
				await redis.setex(cacheKey, 300, JSON.stringify(orders))
			} catch (error) {
				console.error('Redis cache write error:', error)
				// Продолжить без кэширования, если возникла ошибка
			}
		}

		return orders
	}
}

module.exports = new BybitService()
