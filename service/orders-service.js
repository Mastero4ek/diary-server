const OrderDto = require('../dtos/order-dto')
const OrderModel = require('../models/order-model')
const UserModel = require('../models/user-model')
const { ApiError } = require('../exceptions/api-error')
const i18next = require('i18next')

class OrdersService {
	async savedOrder(lng, userId, order, exchange) {
		const existing_order = await OrderModel.findOne({
			user: userId,
			exchange,
			id: order.id,
		})
		if (existing_order) {
			throw ApiError.BadRequest(i18next.t('errors.order_exists', { lng }))
		}

		const new_order = await OrderModel.create({
			user: userId,
			exchange,
			id: order.id,
			symbol: order.symbol,
			closed_time: new Date(order.closed_time).toISOString(),
			open_time: new Date(order.open_time).toISOString(),
			direction: order.direction,
			leverage: order.leverage,
			quality: order.quality,
			margin: order.margin,
			pnl: order.pnl,
			roe: order.roe,
		})

		const order_dto = new OrderDto(new_order)

		return { order: order_dto }
	}

	async removedOrder(language, userId, start_time, end_time, order, exchange) {
		const removed_order = await OrderModel.findOneAndDelete({
			user: userId,
			exchange,
			id: order.id,
		})
		if (!removed_order) {
			throw ApiError.BadRequest(
				language === 'ru'
					? `Ордер не найден или уже удален!`
					: `Order not found or already deleted!`
			)
		}

		const all_orders = await OrderModel.find({
			user: userId,
			exchange,
			closed_time: {
				$gte: new Date(start_time).toISOString(),
				$lte: new Date(end_time).toISOString(),
			},
			open_time: {
				$gte: new Date(start_time).toISOString(),
				$lte: new Date(end_time).toISOString(),
			},
		})

		const orders = all_orders.map(item => new OrderDto(item))

		return orders
	}

	async getBybitSavedOrders(language, userId, start_time, end_time, exchange) {
		const all_orders = await OrderModel.find({
			user: userId,
			exchange,
			closed_time: {
				$gte: new Date(start_time).toISOString(),
				$lte: new Date(end_time).toISOString(),
			},
			open_time: {
				$gte: new Date(start_time).toISOString(),
				$lte: new Date(end_time).toISOString(),
			},
		})

		const orders = all_orders.map(item => new OrderDto(item))

		return orders
	}
}

module.exports = new OrdersService()
