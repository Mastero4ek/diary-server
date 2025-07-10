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
		const visible = key.slice(0, 5)
		const maskedLength = Math.max(0, key.length - 5)
		return visible + '*'.repeat(maskedLength)
	}
}
