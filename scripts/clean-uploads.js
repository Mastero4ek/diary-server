const fs = require('fs')
const path = require('path')

const greenColor = '\x1b[32m'
const redColor = '\x1b[31m'
const resetColor = '\x1b[0m'

async function cleanAllUploads() {
	const uploadsPath = path.join(__dirname, '../uploads')

	if (fs.existsSync(uploadsPath)) {
		const files = fs.readdirSync(uploadsPath)

		for (const file of files) {
			if (file === '.gitkeep') continue
			const filePath = path.join(uploadsPath, file)

			if (fs.lstatSync(filePath).isFile()) {
				fs.unlinkSync(filePath)
			}
		}

		console.log(
			`${greenColor}All files in uploads/ (except .gitkeep) have been deleted!${resetColor}`
		)
	} else {
		console.log(`${redColor}uploads/ directory does not exist.${resetColor}`)
	}
}

module.exports = { cleanAllUploads }

if (require.main === module) {
	cleanAllUploads()
}
