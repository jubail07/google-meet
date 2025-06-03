const User = require('../model/User')
const createJWT = require('../utils/userJWT')

exports.getSignupPage = async (req, res) => {
    return res.render('auth/signup', { msg: '' })
}

exports.signup = async (req, res) => {
    try {
        let existUser = await User.findOne({ username: req.body.username })
        if (existUser) {
            return res.render('auth/signup', { msg: 'user already exist' })
        }
        let userDetails = {
            username: req.body.username,
            password: req.body.password
        }
        await User.create(userDetails)
        return res.redirect('/login')
    } catch (error) {
        console.log('error in signup')
        return res.status(404)
    }
}

exports.getLoginPage = async (req, res) => {
    return res.render('auth/login', { msg: '' })
}

exports.login = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username })
        if (!user) {
            return res.render('auth/login', { msg: 'invalid username or password' })
        }
        const isMatch = await user.validatePassword(req.body.password)
        if (!isMatch) {
            return res.render('auth/login', { msg: 'invalid username or password' })
        }

        const token = createJWT(user)
        res.cookie('userToken', token, { httpOnly: true })
        return res.redirect('/')

    } catch (error) {
        console.log('error in login', error)
        return res.status(404)
    }
}