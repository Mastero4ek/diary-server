module.exports = class KeysDto {
	keys

	constructor(model) {
		this.keys = model.keys.map(item => ({
			id: item.id,
			name: item.name,
			api: this.maskKey(item.api),
			secret: this.maskKey(item.secret),
		}))
	}

	maskKey(key) {
		if (!key) return ''
		// Show first 5 chars
		return key.slice(0, 5) + '*'.repeat(key.length - 5)
	}
}
