const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Ensure uploads directory exists
const uploadsPath = path.join(__dirname, '../uploads')

if (!fs.existsSync(uploadsPath)) {
	fs.mkdirSync(uploadsPath, { recursive: true })
}

// Set up storage for multer
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadsPath)
	},
	filename: (req, file, cb) => {
		// Generate unique filename while preserving extension
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
		const ext = path.extname(file.originalname)

		cb(null, uniqueSuffix + ext)
	},
})

// File filter function
const fileFilter = (req, file, cb) => {
	// Accept only images
	if (file.mimetype.startsWith('image/')) {
		cb(null, true)
	} else {
		cb(new Error('Only image files are allowed!'), false)
	}
}

// Initialize multer with configuration
const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit
		files: 1, // Maximum number of files
	},
})

module.exports = upload
