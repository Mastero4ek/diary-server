const nodemailer = require('nodemailer')
const path = require('path')
const ejs = require('ejs')

class MailService {
	constructor() {
		this.transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: process.env.SMTP_PORT,
			secure: false,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASSWORD,
			},
			tls: {
				rejectUnauthorized: false,
			},
		})
	}

	async sendActivationMail(name, to, language, link) {
		const headerEnPath = path.join(
			__dirname,
			'../mails/assets/images/header-en.png'
		)
		const headerRuPath = path.join(
			__dirname,
			'../mails/assets/images/header-ru.png'
		)
		const buttonPath = path.join(__dirname, '../mails/assets/images/button.png')
		const levelPath = path.join(__dirname, '../mails/assets/images/hamster.png')
		const mailPath = path.join(__dirname, '../mails/assets/images/mail.png')
		const templatePathRu = path.join(__dirname, '../mails/ActivationMailRu.ejs')
		const templatePathEn = path.join(__dirname, '../mails/ActivationMailEn.ejs')

		const mailRu = await ejs.renderFile(templatePathRu, {
			name,
			link,
			email: to,
			header_img_id: 'header-ru',
			level_img_id: 'hamster',
			link_id: 'button',
			mail_img_id: 'mail',
		})
		const mailEn = await ejs.renderFile(templatePathEn, {
			name,
			link,
			email: to,
			header_img_id: 'header-en',
			level_img_id: 'hamster',
			link_id: 'button',
			mail_img_id: 'mail',
		})

		await this.transporter.sendMail({
			from: process.env.SMTP_USER,
			to,
			subject:
				language === 'ru'
					? 'Активация аккаунта на ' + process.env.CLIENT_URL
					: 'Account activation on ' + process.env.CLIENT_URL,
			text: '',
			html: language === 'ru' ? mailRu : mailEn,
			attachments: [
				{
					filename: 'header.png',
					path: language === 'ru' ? headerRuPath : headerEnPath,
					cid: language === 'ru' ? 'header-ru' : 'header-en',
				},
				{
					filename: 'hamster.png',
					path: levelPath,
					cid: 'hamster',
				},
				{
					filename: 'button.png',
					path: buttonPath,
					cid: 'button',
				},
				{
					filename: 'mail.png',
					path: mailPath,
					cid: 'mail',
				},
			],
		})
	}
}

module.exports = new MailService()
