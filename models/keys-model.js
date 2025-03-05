const { Schema, model } = require('mongoose')

const KeysSchema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: 'User' },
	keys: {
		type: Array,
		default: [
			{
				id: 0,
				name: 'bybit',
				api: '',
				secret: '',
			},
			{
				id: 1,
				name: 'mexc',
				api: '',
				secret: '',
			},
			{
				id: 2,
				name: 'okx',
				api: '',
				secret: '',
			},
		],
	},
})

module.exports = model('Keys', KeysSchema)
