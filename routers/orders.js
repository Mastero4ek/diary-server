const Router = require('express').Router
const router = new Router()
const authMiddleware = require('../middlewares/auth-middleware')
const ordersController = require('../controllers/orders-controller')
const { checkSchema } = require('express-validator')
const ValidationSchema = require('../validation/validation-schema')

router.post(
	'/bybit-saved-orders',
	authMiddleware,
	checkSchema(ValidationSchema.orders),
	ordersController.getBybitSavedOrders
)

router.post(
	'/saved-order',
	authMiddleware,
	checkSchema(ValidationSchema.orders),
	ordersController.savedOrder
)

router.post(
	'/removed-order',
	authMiddleware,
	checkSchema(ValidationSchema.orders),
	ordersController.removedOrder
)

module.exports = router
