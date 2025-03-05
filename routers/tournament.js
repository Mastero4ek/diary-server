const Router = require('express').Router
const router = new Router()
const authMiddleware = require('../middlewares/auth-middleware')
const tournamentController = require('../controllers/tournament-controller')
const { checkSchema } = require('express-validator')
const ValidationSchema = require('../validation/validation-schema')

router.post(
	'/tournament',
	authMiddleware,
	checkSchema(ValidationSchema.tournament),
	tournamentController.getTournament
)
router.post(
	'/add_tournament_user',
	authMiddleware,
	tournamentController.addTournamentUser
)

module.exports = router
