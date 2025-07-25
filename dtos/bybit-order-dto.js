module.exports = class BybitOrderDto {
	id
	symbol
	closed_time
	open_time
	direction
	leverage
	quality
	margin
	pnl
	roe

	constructor(model) {
		this.id = model.orderId
		this.symbol = model.symbol
		this.closed_time = +model.updatedTime // reverted: Bybit API returns updatedTime, not closedTime
		this.open_time = +model.createdTime
		this.direction = model.side === 'Buy' ? 'short' : 'long'
		this.leverage = +model.leverage
		this.quality = parseFloat(Number(model.qty).toFixed(4))
		this.margin = parseFloat(Number(model.cumEntryValue).toFixed(2))
		this.pnl = parseFloat(Number(model.closedPnl).toFixed(3))
		this.roe = parseFloat(this.calculateRoe(model).toFixed(2))
	}

	calculateRoe = model => {
		const margin = (model.closedSize * model.avgEntryPrice) / model.leverage
		const roe = (model.closedPnl * 100) / (margin || 1) // Avoid division by 0

		return roe
	}
}

// TODO: Incorrect roe calculation
