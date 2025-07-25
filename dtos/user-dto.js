module.exports = class UserDto {
	id
	name
	role
	last_name
	email
	is_activated
	updated_at
	cover
	source
	phone
	change_password
	google
	github
	tournaments

	constructor(model) {
		this.id = model._id || model.id
		this.name = model.name
		this.role = model.role
		this.last_name = model.last_name
		this.email = model.email
		this.is_activated = model.is_activated
		this.updated_at = model.updated_at.toISOString()
		this.cover = model.cover
		this.source = model.source
		this.phone = model.phone
		this.change_password = model.change_password
		this.google = model.google
		this.github = model.github
		this.tournaments = model.tournaments || []
	}
}
