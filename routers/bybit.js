const Router = require('express').Router
const router = new Router()
const authMiddleware = require('../middlewares/auth-middleware')
const bybitController = require('../controllers/bybit-controller')
const { checkSchema } = require('express-validator')
const ValidationSchema = require('../validation/validation-schema')

router.post(
	'/bybit-orders-pnl',
	authMiddleware,
	checkSchema(ValidationSchema.orders),
	bybitController.getBybitOrdersPnl
)

router.post(
	'/bybit-tickers',
	authMiddleware,
	checkSchema(ValidationSchema.orders),
	bybitController.getBybitTickers
)

module.exports = router
