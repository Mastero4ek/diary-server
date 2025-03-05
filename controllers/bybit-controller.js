const BybitService = require('../service/bybit-service')
const KeysService = require('../service/keys-service')
const Helpers = require('../helpers/helpers')
const OrdersService = require('../service/orders-service')
const UserModel = require('../models/user-model')
const ApiError = require('../exceptions/api-error')

class BybitController {
	async getBybitOrdersPnl(req, res, next) {
		try {
			const { email, sort, search, page, limit, start_time, end_time } =
				req.body
			const { language } = req.cookies

			const user = await UserModel.findOne({ email })
			if (!user) {
				throw ApiError.BadRequest(
					language === 'ru'
						? `Пользователь с почтовым адресом ${email} не найден!`
						: `User with email address ${email} not found!`
				)
			}

			const keys = await KeysService.findKeys(email, language)
			if (!keys || keys.message) {
				throw ApiError.BadRequest(
					language === 'ru' ? 'Ключи не найдены!' : 'Keys not found!'
				)
			}

			const current_keys = keys.keys.find(item => item.name === 'bybit')
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
				email,
				start_time,
				end_time,
				'bybit'
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
			const { email } = req.body
			const { language } = req.cookies

			const user = await UserModel.findOne({ email })
			if (!user) {
				throw ApiError.BadRequest(
					language === 'ru'
						? `Пользователь с почтовым адресом ${email} не найден!`
						: `User with email address ${email} not found!`
				)
			}

			const keys = await KeysService.findKeys(email, language)
			if (!keys || keys.message) {
				throw ApiError.BadRequest(
					language === 'ru' ? 'Ключи не найдены!' : 'Keys not found!'
				)
			}

			const current_keys = keys.keys.find(item => item.name === 'bybit')
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
}

module.exports = new BybitController()
