module.exports = class UserDto {
	id
	name
	last_name
	email
	is_activated
	updated_at
	cover
	source
	phone
	change_password

	constructor(model) {
		this.id = model._id
		this.name = model.name
		this.last_name = model.last_name
		this.email = model.email
		this.is_activated = model.is_activated
		this.updated_at = model.updated_at.getTime()
		this.cover = model.cover
		this.source = model.source
		this.phone = model.phone
		this.change_password = model.change_password
	}
}
