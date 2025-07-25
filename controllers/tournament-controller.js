const tournamentService = require('../service/tournament-service')

class TournamentController {
	async addTournamentUser(req, res, next) {
		try {
			const { exchange } = req.body
			const user = req.user

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

	async createTournament(req, res, next) {
		try {
			const tournament = await tournamentService.createTournament(
				req.body,
				req.file
			)
			return res.json(tournament)
		} catch (e) {
			next(e)
		}
	}
}

module.exports = new TournamentController()
