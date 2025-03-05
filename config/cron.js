const cron = require('node-cron')
const moment = require('moment')
const userService = require('../service/user-service')
const tournamentService = require('../service/tournament-service')

// Schedule tournament creation
const scheduleTournamentCreation = () => {
	const currentDate = moment()
	const daysInMonth = currentDate.daysInMonth()
	const targetDate = daysInMonth - 7

	if (currentDate.date() < targetDate) {
		const cronTime = `0 0 ${targetDate} ${currentDate.month() + 1} *`

		cron.schedule(cronTime, () => {
			tournamentService.createTournament('Bybit')
			tournamentService.createTournament('Mexc')
			tournamentService.createTournament('Okx')
		})
	} else {
		console.log('The target date has already passed or is today!')
	}
}

// Initialize cron jobs
const initCronJobs = () => {
	// Run every hour
	cron.schedule('0 * * * *', () => {
		userService.deleteInactiveUsers()
		scheduleTournamentCreation()
	})
}

module.exports = initCronJobs
