const Router = require('express').Router
const userController = require('../controllers/user-controller')
const fileController = require('../controllers/file-controller')
const keysController = require('../controllers/keys-controller')
const router = new Router()
const { checkSchema } = require('express-validator')
const authMiddleware = require('../middlewares/auth-middleware')
const ValidationSchema = require('../validation/validation-schema')
const upload = require('../config/multer')
const fileValidation = require('../middlewares/file-validation')

// User profile image validation options
const profileImageValidation = fileValidation({
	allowedTypes: ['image/jpeg', 'image/png'],
	maxSize: 5 * 1024 * 1024, // 5MB
	minSize: 1024, // 1KB
})

router.post(
	'/sign-up',
	checkSchema(ValidationSchema.registration),
	userController.signUp
)
router.post(
	'/sign-in',
	checkSchema(ValidationSchema.login),
	userController.signIn
)
router.get('/refresh', userController.refresh)
router.post('/logout', userController.logout)
router.get('/activate/:link', userController.activate)
router.get('/user/:id', userController.getUser)

router.post(
	'/edit-user',
	authMiddleware,
	upload.single('cover'),
	profileImageValidation,
	userController.editUser
)
router.post(
	'/remove-cover/:filename',
	authMiddleware,
	fileController.removeCover
)

router.post(
	'/remove-user',
	authMiddleware,
	checkSchema(ValidationSchema.remove),
	userController.removeUser
)

router.post('/update-keys', authMiddleware, keysController.updateKeys)

module.exports = router
