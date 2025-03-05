const { Schema, model } = require('mongoose')

const TournamentUserSchema = new Schema({
	tournament: { type: Schema.Types.ObjectId, ref: 'Tournament' },
	id: { type: Schema.Types.ObjectId, required: true },
	name: { type: String, required: true },
	cover: { type: String, default: null },
	level: { type: Object, required: true },
	registration_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now },
})

module.exports = model('TournamentUser', TournamentUserSchema)
