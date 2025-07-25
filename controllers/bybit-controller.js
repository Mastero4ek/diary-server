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

				throw ApiError.BadRequest(msg)
			}

			const startMsPnl =
				typeof start_time === 'string'
					? new Date(start_time).getTime()
					: start_time
			const endMsPnl =
				typeof end_time === 'string' ? new Date(end_time).getTime() : end_time
			const orders = await BybitService.getBybitOrdersPnl(
				req.lng,
				current_keys,
				startMsPnl,
				endMsPnl
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

				throw ApiError.BadRequest(msg)
			}

			const startMsWallet =
				typeof start_time === 'string'
					? new Date(start_time).getTime()
					: start_time
			const endMsWallet =
				typeof end_time === 'string' ? new Date(end_time).getTime() : end_time
			const wallet = await BybitService.getBybitWallet(req.lng, current_keys)

			const orders = await BybitService.getBybitOrdersPnl(
				req.lng,
				current_keys,
				startMsWallet,
				endMsWallet
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

				throw ApiError.BadRequest(msg)
			}

			const startMsPositions =
				typeof start_time === 'string'
					? new Date(start_time).getTime()
					: start_time
			const endMsPositions =
				typeof end_time === 'string' ? new Date(end_time).getTime() : end_time
			const positions = await BybitService.getBybitPositions(
				req.lng,
				current_keys
			)

			const period = Array.from({ length: 7 }, (_, i) => {
				const startOfDay = moment()
					.startOf('isoWeek')
					.add(i, 'days')
					.toISOString()
				const endOfDay = moment()
					.startOf('isoWeek')
					.add(i, 'days')
					.endOf('day')
					.toISOString()
				const dayName = moment().startOf('isoWeek').add(i, 'days').format('ddd') // Short name of the day

				return { start: startOfDay, end: endOfDay, day: dayName } // Return the object
			})

			const ordersByDay = await Promise.all(
				period.map(async periodItem => {
					const orders = await BybitService.getBybitOrdersPnl(
						req.lng,
						current_keys,
						periodItem.start,
						periodItem.end
					)

					const total = await Helpers.calculateTotalProfit(orders)

					return {
						day: periodItem.day,
						net_profit: +parseFloat(total.profit + total.loss).toFixed(2),
					} // Return an object with the day and orders
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

	async getProfitByDay(req, res, next) {
		try {
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
				throw ApiError.BadRequest(msg)
			}

			const start = moment(start_time).startOf('day')
			const end = moment(end_time).startOf('day')
			// const days = end.diff(start, 'days') + 1

			const startMs = start.valueOf()
			const endMs = end.endOf('day').valueOf()

			// Получаем все ордера за диапазон одним вызовом
			const orders = await BybitService.getBybitOrdersPnl(
				req.lng,
				current_keys,
				startMs,
				endMs
			)

			// Группируем ордера по дням (UTC)
			const grouped = {}
			for (const o of orders) {
				const day = moment(o.closed_time)
					.utc()
					.startOf('day')
					.format('YYYY-MM-DD')
				if (!grouped[day]) grouped[day] = []
				grouped[day].push(o)
			}

			// Вычисляем min/max дату среди всех ордеров
			const closedTimes = orders.map(o => o.closed_time)
			const minDate = moment(Math.min(...closedTimes))
				.utc()
				.startOf('day')
			const maxDate = moment(Math.max(...closedTimes))
				.utc()
				.startOf('day')
			const days = maxDate.diff(minDate, 'days') + 1

			let result = []
			for (let i = 0; i < days; i++) {
				const day = minDate.clone().add(i, 'day').format('YYYY-MM-DD')
				const ordersForDay = grouped[day] || []
				const profit = ordersForDay.reduce((sum, o) => sum + o.pnl, 0)
				result.push({ date: day, profit, count: ordersForDay.length })
			}
			const totalProfitByDay = result.reduce((sum, d) => sum + d.profit, 0)

			return res.json({
				items: result,
			})
		} catch (e) {
			next(e)
		}
	}
}

module.exports = new BybitController()
