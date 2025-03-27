const BybitService = require('../service/bybit-service')
const KeysService = require('../service/keys-service')
const Helpers = require('../helpers/helpers')
const OrdersService = require('../service/orders-service')
const ApiError = require('../exceptions/api-error')
const moment = require('moment')

class BybitController {
	async getBybitOrdersPnl(req, res, next) {
		try {
			const { exchange, sort, search, page, limit, start_time, end_time } =
				req.body
			const { language } = req.cookies
			const user = req.user

			const keys = await KeysService.findKeys(user.id, language)
			if (!keys || keys.message) {
				throw ApiError.BadRequest(
					language === 'ru' ? 'Ключи не найдены!' : 'Keys not found!'
				)
			}

			const current_keys = keys.keys.find(item => item.name === exchange)
			if (!current_keys || !current_keys.api || !current_keys.secret) {
				throw ApiError.BadRequest(
					language === 'ru'
						? `Ключи ${Helpers.capitalize(exchange)} не настроены!`
						: `${exchange} keys are not configured!`
				)
			}

			const orders = await BybitService.getBybitOrdersPnl(
				language,
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
				language,
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
			const { language } = req.cookies

			const keys = await KeysService.findKeys(user.id, language)
			if (!keys || keys.message) {
				throw ApiError.BadRequest(
					language === 'ru' ? 'Ключи не найдены!' : 'Keys not found!'
				)
			}

			const current_keys = keys.keys.find(item => item.name === exchange)
			if (!current_keys || !current_keys.api || !current_keys.secret) {
				throw ApiError.BadRequest(
					language === 'ru'
						? `Ключи ${Helpers.capitalize(exchange)} не настроены!`
						: `${exchange} keys are not configured!`
				)
			}

			const tickers = await BybitService.getBybitTickers(language, current_keys)

			return res.json(tickers)
		} catch (e) {
			next(e)
		}
	}

	async getBybitWallet(req, res, next) {
		try {
			const { exchange, start_time, end_time } = req.body
			const { language } = req.cookies
			const user = req.user

			const keys = await KeysService.findKeys(user.id, language)
			if (!keys || keys.message) {
				throw ApiError.BadRequest(
					language === 'ru' ? 'Ключи не найдены!' : 'Keys not found!'
				)
			}

			const current_keys = keys.keys.find(item => item.name === exchange)
			if (!current_keys || !current_keys.api || !current_keys.secret) {
				throw ApiError.BadRequest(
					language === 'ru'
						? `Ключи ${Helpers.capitalize(exchange)} не настроены!`
						: `${exchange} keys are not configured!`
				)
			}

			const wallet = await BybitService.getBybitWallet(language, current_keys)

			const orders = await BybitService.getBybitOrdersPnl(
				language,
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
			const { exchange, sort, search, page, limit } = req.body
			const { language } = req.cookies
			const user = req.user

			const keys = await KeysService.findKeys(user.id, language)
			if (!keys || keys.message) {
				throw ApiError.BadRequest(
					language === 'ru' ? 'Ключи не найдены!' : 'Keys not found!'
				)
			}

			const current_keys = keys.keys.find(item => item.name === exchange)
			if (!current_keys || !current_keys.api || !current_keys.secret) {
				throw ApiError.BadRequest(
					language === 'ru'
						? `Ключи ${Helpers.capitalize(exchange)} не настроены!`
						: `${exchange} keys are not configured!`
				)
			}

			const positions = await BybitService.getBybitPositions(
				language,
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
						language,
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
