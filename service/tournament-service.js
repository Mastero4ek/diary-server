const TournamentModel = require('../models/tournament-model')
const TournamentUserModel = require('../models/tournament_user-model')
const UserModel = require('../models/user-model')
const LevelModel = require('../models/level-model')
const moment = require('moment')
const { ApiError } = require('../exceptions/api-error')
const i18next = require('i18next')
const fileService = require('./file-service')
const mongoose = require('mongoose')
const FileModel = require('../models/file-model')
const fs = require('fs')
const path = require('path')

class TournamentService {
	// async createTournament(exchange) {
	// 	const start_date = moment().add(1, 'months').startOf('month')
	// 	const end_date = moment(start_date).endOf('month')
	// 	const registration_date = moment(start_date)
	// 		.subtract(7, 'days')
	// 		.startOf('day')

	// 	const formatDate = date => {
	// 		return moment(date).format('DD.MM.YYYY - HH:mm:ss')
	// 	}

	// 	const tournament = await TournamentModel.create({
	// 		name: start_date.format('MMMM'),
	// 		exchange: exchange,
	// 		start_date: start_date.toISOString(),
	// 		end_date: end_date.toISOString(),
	// 		registration_date: registration_date.toISOString(),
	// 	})

	// 	const lightblueColor = '\u001b[36m'
	// 	const resetColor = '\x1b[0m'

	// 	return console.log(
	// 		`${lightblueColor}Соревнование месяца:\n\tбиржа: ${tournament.exchange}\n\tмесяц: ${tournament.name}\n` +
	// 			`Длительность соревнования:\n\tначало: ${formatDate(
	// 				tournament.start_date
	// 			)}\n\tконец: ${formatDate(tournament.end_date)}\n` +
	// 			`Время регистрации:\n\tначало: ${formatDate(
	// 				tournament.registration_date
	// 			)}\n\tконец: ${formatDate(tournament.start_date)}${resetColor}`
	// 	)
	// }

	async addTournamentUser(exchange, userId, lng, page = 1, limit = 5) {
		exchange = exchange ? exchange.toLowerCase() : exchange
		const user = await UserModel.findOne({ _id: userId })
		const tournament = await TournamentModel.findOne({ exchange })

		if (!tournament) {
			throw ApiError.BadRequest(
				i18next.t('errors.tournament_not_found', { lng, exchange })
			)
		}

		if (!user) {
			throw ApiError.BadRequest(
				i18next.t('errors.user_with_email_not_found', { lng })
			)
		}
		// Проверка: уже есть такой участник?
		const alreadyJoined = await TournamentUserModel.findOne({
			tournament: tournament._id,
			id: user._id,
		})
		if (alreadyJoined) {
			throw ApiError.BadRequest(
				i18next.t('errors.already_joined', { lng, exchange })
			)
		}

		const level = await LevelModel.findOne({ user: user._id })
		await TournamentUserModel.create({
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
		// Добавить турнир в user.tournaments, если его там нет
		if (!user.tournaments) user.tournaments = []
		if (!user.tournaments.some(t => t.id.equals(tournament._id))) {
			user.tournaments.push({ exchange, id: tournament._id })
			await user.save()
		}
		const users = await TournamentUserModel.find({ tournament: tournament._id })
			.skip((page - 1) * limit)
			.limit(limit)
			.exec()
		if (!users || users.length === 0) {
			return {
				tournament,
				users: [],
				total: 0,
				message: i18next.t('errors.no_members', { lng }),
			}
		}
		const total = await TournamentUserModel.countDocuments()
		return { tournament, users, total }
	}

	async getTournament(exchange, lng, page = 1, size = 5, cursor = null) {
		exchange = exchange ? exchange.toLowerCase() : exchange
		const tournament = await TournamentModel.findOne({ exchange })

		if (!tournament) {
			throw ApiError.BadRequest(
				i18next.t('errors.tournament_not_found', { lng, exchange })
			)
		}

		const skip = (parseInt(page) - 1) * parseInt(size)
		const limit = parseInt(size)
		let query = { tournament: tournament._id }

		if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
			query._id = { $gt: mongoose.Types.ObjectId(cursor) }
		}

		const participants = await TournamentUserModel.find(query)
			.skip(skip)
			.limit(limit)
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
				message: i18next.t('errors.no_members', { lng }),
			}
		}

		return {
			tournament,
			users: items,
			hasMore,
			nextCursor: hasMore ? items[items.length - 1]._id : null,
		}
	}

	async createTournament(data, file, lng) {
		let {
			name,
			description,
			start_date,
			end_date,
			registration_date,
			exchange,
		} = data
		exchange = exchange ? exchange.toLowerCase() : exchange

		let coverUrl = null
		let fileDoc = null
		let tempTournament = null

		if (file) {
			tempTournament = await TournamentModel.create({
				name,
				description,
				cover: null,
				start_date,
				end_date,
				registration_date,
				exchange,
			})

			fileDoc = await fileService.uploadCover(
				file,
				null,
				lng,
				tempTournament._id
			)
			coverUrl = process.env.API_URL + '/uploads/' + file.filename
			tempTournament.cover = coverUrl

			await tempTournament.save()
		} else {
			tempTournament = await TournamentModel.create({
				name,
				description,
				cover: null,
				start_date,
				end_date,
				registration_date,
				exchange,
			})
		}

		const tournament = await this.getTournament(exchange, lng, 1, 5)

		return tournament
	}

	async removeTournament(tournamentId) {
		const tournament = await TournamentModel.findByIdAndDelete(tournamentId)
		if (!tournament) return null
		// Удаляем все файлы турнира
		const files = await FileModel.find({ tournament: tournament._id })
		for (const file of files) {
			const filePath = path.join(__dirname, '../uploads', file.name)
			if (fs.existsSync(filePath)) {
				try {
					fs.unlinkSync(filePath)
				} catch (err) {
					if (err.code !== 'ENOENT') throw err
					// Если файл не найден, просто продолжаем
				}
			}
			await file.deleteOne()
		}
		// Удаляем всех участников турнира
		await TournamentUserModel.deleteMany({ tournament: tournament._id })

		// Удаляем турнир из массива tournaments у всех пользователей
		await UserModel.updateMany(
			{ 'tournaments.id': tournament._id },
			{ $pull: { tournaments: { id: tournament._id } } }
		)
		return tournament
	}

	async removeTournamentUser(tournamentId, userId) {
		const tournament = await TournamentModel.findById(tournamentId)
		if (!tournament) {
			throw ApiError.BadRequest('Tournament not found')
		}

		const user = await UserModel.findById(userId)
		if (!user) {
			throw ApiError.BadRequest('User not found')
		}

		await TournamentUserModel.deleteOne({
			tournament: tournamentId,
			id: userId,
		})

		await UserModel.updateOne(
			{ _id: userId },
			{ $pull: { tournaments: { id: tournamentId } } }
		)
		return { message: 'User removed from tournament' }
	}
}

module.exports = new TournamentService()
