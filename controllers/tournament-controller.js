const tournamentService = require('../service/tournament-service')
const i18next = require('i18next')

class TournamentController {
	async addTournamentUser(req, res, next) {
		try {
			const { exchange } = req.body
			const user = req.user
			// const { language } = req.cookies // Удалено

			const bid_user = await tournamentService.addTournamentUser(
				exchange,
				user.id,
				req.lng
			)

			return res.json(bid_user)
		} catch (e) {
			next(e)
		}
	}

	async getTournament(req, res, next) {
		try {
			const { exchange } = req.body
			// const { language } = req.cookies // Удалено
			const { page, size } = req.query

			const tournament = await tournamentService.getTournament(
				exchange,
				req.lng,
				page,
				size
			)

			return res.json(tournament)
		} catch (e) {
			next(e)
		}
	}
}

module.exports = new TournamentController()
