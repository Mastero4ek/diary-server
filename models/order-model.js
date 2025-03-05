const { Schema, model } = require('mongoose')

const OrderSchema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: 'User' },
	exchange: { type: String, required: true },
	id: { type: String, required: true },
	symbol: { type: String, required: true },
	closed_time: { type: Date, required: true },
	open_time: { type: Date, required: true },
	direction: { type: String, required: true },
	leverage: { type: Number, required: true },
	quality: { type: Number, required: true },
	margin: { type: Number, required: true },
	pnl: { type: Number, required: true },
	roe: { type: Number, required: true },
})

module.exports = model('Order', OrderSchema)
