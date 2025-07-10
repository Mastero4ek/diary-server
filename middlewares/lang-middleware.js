module.exports = (req, res, next) => {
	req.lng =
		req.cookies?.language ||
		req.headers['accept-language']?.split(',')[0]?.slice(0, 2) ||
		'en'
	next()
}
