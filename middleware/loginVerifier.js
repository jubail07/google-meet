const JWT = require('jsonwebtoken')

exports.ifUserLoggedIn = async (req, res, next) => {
    const userToken = req.cookies.userToken
    if (userToken) {
        let decoded = JWT.verify(userToken, process.env.JWT_SECRET)
        if (decoded) {
            req.user = decoded
            next()
        } else {
            return res.clearCookie('userToken').render('auth/login', { msg: 'unexpected error' })
        }
    } else {
        return res.redirect('/login')
    }

}