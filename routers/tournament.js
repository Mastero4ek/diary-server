const Router = require('express').Router
const router = new Router()
const authMiddleware = require('../middlewares/auth-middleware')
const tournamentController = require('../controllers/tournament-controller')
const { checkSchema } = require('express-validator')
const ValidationSchema = require('../validation/validation-schema')
const upload = require('../config/multer')

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
router.post(
	'/create_tournament',
	authMiddleware,
	upload.single('cover'),
	tournamentController.createTournament
)
router.post(
	'/remove_tournament_user',
	authMiddleware,
	tournamentController.removeTournamentUser
)
router.delete(
	'/tournament/:id',
	authMiddleware,
	tournamentController.deleteTournament
)

module.exports = router
