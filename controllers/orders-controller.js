const Helpers = require('../helpers/helpers')
const OrdersService = require('../service/orders-service')

class OrdersController {
	async savedOrder(req, res, next) {
		try {
			const { order, exchange } = req.body
			const user = req.user
			const { language } = req.cookies

			const new_order = await OrdersService.savedOrder(
				language,
				user.id,
				order,
				exchange
			)

			return res.json(new_order)
		} catch (e) {
			next(e)
		}
	}

	async removedOrder(req, res, next) {
		try {
			const {
				order,
				exchange,
				page,
				limit,
				sort,
				search,
				start_time,
				end_time,
			} = req.body
			const { language } = req.cookies
			const user = req.user

			const orders = await OrdersService.removedOrder(
				language,
				user.id,
				start_time,
				end_time,
				order,
				exchange
			)

			const paginated_orders = await Helpers.paginate(
				orders,
				page,
				limit,
				sort,
				search
			)

			const total = await Helpers.calculateTotalPnl(orders)

			return res.json({
				orders: paginated_orders.items,
				total_pages: paginated_orders.totalPages,
				total_profit: +total.profit,
				total_loss: +total.loss,
			})
		} catch (e) {
			next(e)
		}
	}

	async getBybitSavedOrders(req, res, next) {
		try {
			const { sort, search, page, limit, start_time, end_time, exchange } =
				req.body
			const { language } = req.cookies
			const user = req.user

			const orders = await OrdersService.getBybitSavedOrders(
				language,
				user.id,
				start_time,
				end_time,
				exchange
			)

			const paginated_orders = await Helpers.paginate(
				orders,
				page,
				limit,
				sort,
				search
			)

			const total = await Helpers.calculateTotalPnl(orders)

			return res.json({
				orders: paginated_orders.items,
				total_pages: paginated_orders.totalPages,
				total_profit: +total.profit,
				total_loss: +total.loss,
			})
		} catch (e) {
			next(e)
		}
	}
}

module.exports = new OrdersController()
