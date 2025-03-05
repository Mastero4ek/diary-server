const { Schema, model } = require('mongoose')

const LevelSchema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: 'User' },
	level: {
		type: Object,
		default: { name: 'hamster', value: 0 },
		required: true,
	},
})

module.exports = model('Level', LevelSchema)
