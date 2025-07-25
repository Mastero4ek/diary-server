const { Schema, model } = require('mongoose')

const TournamentSchema = new Schema({
	name: { type: String, require: true },
	description: { type: String, default: null },
	cover: { type: String, default: null },
	exchange: { type: String, require: true, unique: true },
	registration_date: { type: Date, require: true },
	start_date: { type: Date, require: true },
	end_date: { type: Date, require: true },
})

module.exports = model('Tournament', TournamentSchema)
