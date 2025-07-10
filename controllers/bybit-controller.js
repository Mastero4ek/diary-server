const BybitService = require('../service/bybit-service')
const KeysService = require('../service/keys-service')
const Helpers = require('../helpers/helpers')
const OrdersService = require('../service/orders-service')
const { ApiError } = require('../exceptions/api-error')
const moment = require('moment')
const i18next = require('i18next')

class BybitController {
	async getBybitOrdersPnl(req, res, next) {
		try {
			console.log(
				'getBybitOrdersPnl req.lng:',
				req.lng,
				'exchange:',
				req.body.exchange
			)
			const { exchange, sort, search, page, limit, start_time, end_time } =
				req.body
			const user = req.user

			const keys = await KeysService.findKeys(user.id, req.lng)
			if (!keys || keys.message) {
				throw ApiError.BadRequest(
					i18next.t('errors.keys_not_found', { lng: req.lng })
				)
			}

			const current_keys = keys.keys.find(item => item.name === exchange)
			if (!current_keys || !current_keys.api || !current_keys.secret) {
				const msg = i18next.t('errors.keys_not_configured', {
					lng: req.lng,
					exchange: Helpers.capitalize(exchange),
				})
				console.log('i18n msg:', msg, 'lng:', req.lng)
				throw ApiError.BadRequest(msg)
			}

			const orders = await BybitService.getBybitOrdersPnl(
				req.lng,
				current_keys,
				start_time,
				end_time
			)

			const paginated_orders = await Helpers.paginate(
				orders,
				page,
				limit,
				sort,
				search
			)

			const total = await Helpers.calculateTotalPnl(orders)

			const bookmarks = await OrdersService.getBybitSavedOrders(
				req.lng,
				user.id,
				start_time,
				end_time,
				exchange
			)

			return res.json({
				bookmarks,
				orders: paginated_orders.items,
				total_pages: paginated_orders.totalPages,
				total_profit: +total.profit,
				total_loss: +total.loss,
			})
		} catch (e) {
			next(e)
		}
	}

	async getBybitTickers(req, res, next) {
		try {
			const { exchange } = req.body
			const user = req.user

			const keys = await KeysService.findKeys(user.id, req.lng)
			if (!keys || keys.message) {
				throw ApiError.BadRequest(
					i18next.t('errors.keys_not_found', { lng: req.lng })
				)
			}

			const current_keys = keys.keys.find(item => item.name === exchange)
			if (!current_keys || !current_keys.api || !current_keys.secret) {
				const msg = i18next.t('errors.keys_not_configured', {
					lng: req.lng,
					exchange: Helpers.capitalize(exchange),
				})
				console.log('i18n msg:', msg, 'lng:', req.lng)
				throw ApiError.BadRequest(msg)
			}

			const tickers = await BybitService.getBybitTickers(req.lng, current_keys)

			return res.json(tickers)
		} catch (e) {
			next(e)
		}
	}

	async getBybitWallet(req, res, next) {
		try {
			console.log(
				'getBybitWallet req.lng:',
				req.lng,
				'exchange:',
				req.body.exchange
			)
			const { exchange, start_time, end_time } = req.body
			const user = req.user

			const keys = await KeysService.findKeys(user.id, req.lng)
			if (!keys || keys.message) {
				throw ApiError.BadRequest(
					i18next.t('errors.keys_not_found', { lng: req.lng })
				)
			}

			const current_keys = keys.keys.find(item => item.name === exchange)
			if (!current_keys || !current_keys.api || !current_keys.secret) {
				const msg = i18next.t('errors.keys_not_configured', {
					lng: req.lng,
					exchange: Helpers.capitalize(exchange),
				})
				console.log('i18n msg:', msg, 'lng:', req.lng)
				throw ApiError.BadRequest(msg)
			}

			const wallet = await BybitService.getBybitWallet(req.lng, current_keys)

			const orders = await BybitService.getBybitOrdersPnl(
				req.lng,
				current_keys,
				start_time,
				end_time
			)

			const total = await Helpers.calculateTotalProfit(orders)

			return res.json({
				total_balance: +wallet.total_balance,
				unrealised_pnl: +wallet.unrealised_pnl,
				total_profit: +total.profit,
				total_loss: +total.loss,
				wining_trades: +total.profitCount,
				losing_trades: +total.lossCount,
			})
		} catch (e) {
			next(e)
		}
	}

	async getBybitPositions(req, res, next) {
		try {
			console.log(
				'getBybitPositions req.lng:',
				req.lng,
				'exchange:',
				req.body.exchange
			)
			const { exchange, sort, search, page, limit } = req.body
			const user = req.user

			const keys = await KeysService.findKeys(user.id, req.lng)
			if (!keys || keys.message) {
				throw ApiError.BadRequest(
					i18next.t('errors.keys_not_found', { lng: req.lng })
				)
			}

			const current_keys = keys.keys.find(item => item.name === exchange)
			if (!current_keys || !current_keys.api || !current_keys.secret) {
				const msg = i18next.t('errors.keys_not_configured', {
					lng: req.lng,
					exchange: Helpers.capitalize(exchange),
				})
				console.log('i18n msg:', msg, 'lng:', req.lng)
				throw ApiError.BadRequest(msg)
			}

			const positions = await BybitService.getBybitPositions(
				req.lng,
				current_keys
			)

			const period = Array.from({ length: 7 }, (_, i) => {
				const startOfDay = moment().startOf('isoWeek').add(i, 'days').valueOf() // Start of the day in milliseconds
				const endOfDay = moment()
					.startOf('isoWeek')
					.add(i, 'days')
					.endOf('day')
					.valueOf() // End of the day in milliseconds
				const dayName = moment().startOf('isoWeek').add(i, 'days').format('ddd') // Short name of the day

				return { start: startOfDay, end: endOfDay, day: dayName } // Return the object
			})

			const ordersByDay = await Promise.all(
				period.map(async periodItem => {
					const orders = await BybitService.getBybitOrdersPnl(
						req.lng,
						current_keys,
						periodItem.start, // Используем start для начала времени
						periodItem.end // Используем end для конца времени
					)

					const total = await Helpers.calculateTotalProfit(orders)

					return {
						day: periodItem.day,
						net_profit: +parseFloat(total.profit + total.loss).toFixed(2),
					} // Возвращаем объект с днем и заказами
				})
			)

			const paginated_positions = await Helpers.paginate(
				positions,
				page,
				limit,
				sort,
				search
			)

			return res.json({
				positions: paginated_positions.items,
				total_pages: paginated_positions.totalPages,
				ordersByDay,
			})
		} catch (e) {
			next(e)
		}
	}
}

module.exports = new BybitController()
