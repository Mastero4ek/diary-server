const BybitService = require('../service/bybit-service')
const KeysService = require('../service/keys-service')
const Helpers = require('../helpers/helpers')
const OrdersService = require('../service/orders-service')
const ApiError = require('../exceptions/api-error')

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
						? 'Ключи Bybit не настроены!'
						: 'Bybit keys are not configured!'
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
						? 'Ключи Bybit не настроены!'
						: 'Bybit keys are not configured!'
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
						? 'Ключи Bybit не настроены!'
						: 'Bybit keys are not configured!'
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
}

module.exports = new BybitController()
