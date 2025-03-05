const tournamentService = require('../service/tournament-service')

class TournamentController {
	async addTournamentUser(req, res, next) {
		try {
			const { email, exchange } = req.body
			const { language } = req.cookies

			const bid_user = await tournamentService.addTournamentUser(
				exchange,
				email,
				language
			)

			return res.json(bid_user)
		} catch (e) {
			next(e)
		}
	}

	async getTournament(req, res, next) {
		try {
			const { exchange } = req.body
			const { language } = req.cookies
			const { page, size } = req.query

			const tournament = await tournamentService.getTournament(
				exchange,
				language,
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
