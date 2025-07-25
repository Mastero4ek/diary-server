const { Schema, model } = require('mongoose')

const FileSchema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
	tournament: { type: Schema.Types.ObjectId, ref: 'Tournament', default: null },
	name: { type: String, required: true },
	size: { type: Number, default: null },
	mimetype: { type: String, required: true },
})

module.exports = model('File', FileSchema)
