const TournamentModel = require('../models/tournament-model')
const TournamentUserModel = require('../models/tournament_user-model')
const UserModel = require('../models/user-model')
const LevelModel = require('../models/level-model')
const moment = require('moment')
const ApiError = require('../exceptions/api-error')

class TournamentService {
	async createTournament(exchange) {
		const start_date = moment().add(1, 'months').startOf('month')
		const end_date = moment(start_date).endOf('month')
		const registration_date = moment(start_date)
			.subtract(7, 'days')
			.startOf('day')

		const formatDate = date => {
			return moment(date).format('DD.MM.YYYY - HH:mm:ss')
		}

		const tournament = await TournamentModel.create({
			name: start_date.format('MMMM'),
			exchange: exchange,
			start_date: start_date.toDate(),
			end_date: end_date.toDate(),
			registration_date: registration_date.toDate(),
		})

		const lightblueColor = '\u001b[36m'
		const resetColor = '\x1b[0m'

		return console.log(
			`${lightblueColor}Соревнование месяца:\n\tбиржа: ${tournament.exchange}\n\tмесяц: ${tournament.name}\n` +
				`Длительность соревнования:\n\tначало: ${formatDate(
					tournament.start_date
				)}\n\tконец: ${formatDate(tournament.end_date)}\n` +
				`Время регистрации:\n\tначало: ${formatDate(
					tournament.registration_date
				)}\n\tконец: ${formatDate(tournament.start_date)}${resetColor}`
		)
	}

	async addTournamentUser(exchange, email, language, page = 1, limit = 5) {
		const user = await UserModel.findOne({ email })
		const tournament = await TournamentModel.findOne({ exchange })

		if (!tournament) {
			throw ApiError.BadRequest(
				language === 'ru'
					? `Соревнование на бирже ${exchange} не найдено!`
					: `Tournament on the ${exchange} exchange not found!`
			)
		}

		if (!user) {
			throw ApiError.BadRequest(
				language === 'ru'
					? `Пользователь с email адресом - ${email} не найден!`
					: `User with email - ${email} was not found!`
			)
		}

		const level = await LevelModel.findOne({ user: user._id })

		const tournament_user = await TournamentUserModel.create({
			tournament: tournament._id,
			id: user._id,
			name: user.name,
			cover: user.cover,
			level: {
				name: level.level.name || 'hamster',
				value: level.level.value || 0,
			},
			updated_at: user.updated_at,
		})

		const users = await TournamentUserModel.find({ tournament: tournament._id })
			.skip((page - 1) * limit) // Пропускаем юзеров до текущей страницы
			.limit(limit) // Ограничиваем количество юзеров на странице
			.exec() // Выполняем запрос

		if (!users || users.length === 0) {
			return {
				tournament,
				users: [],
				total: 0,
				message:
					language === 'ru'
						? `На данный момент нет участников!`
						: `There are currently no members!`,
			}
		}

		const total = await TournamentUserModel.countDocuments() // Общее количество юзеров

		return { tournament, users, total }
	}

	async getTournament(exchange, language, cursor, limit = 5) {
		const tournament = await TournamentModel.findOne({ exchange })

		if (!tournament) {
			throw ApiError.BadRequest(
				language === 'ru'
					? `Соревнование на бирже ${exchange} не найдено!`
					: `Tournament on the ${exchange} exchange not found!`
			)
		}

		// Build query based on cursor
		const query = cursor
			? {
					tournament: tournament._id,
					_id: { $gt: cursor },
			  }
			: { tournament: tournament._id }

		// Fetch one extra item to determine if there are more results
		const participants = await TournamentUserModel.find(query)
			.limit(limit + 1)
			.sort({ _id: 1 })
			.exec()

		const hasMore = participants.length > limit
		const items = hasMore ? participants.slice(0, -1) : participants

		if (!items || items.length === 0) {
			return {
				tournament,
				users: [],
				hasMore: false,
				nextCursor: null,
				message:
					language === 'ru'
						? `На данный момент нет участников!`
						: `There are currently no members!`,
			}
		}

		return {
			tournament,
			users: items,
			hasMore,
			nextCursor: hasMore ? items[items.length - 1]._id : null,
		}
	}
}

module.exports = new TournamentService()
