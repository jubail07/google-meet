const express = require('express')
const router = express.Router()

const { getSignupPage, getLoginPage, signup, login } = require('../controller/auth')

router
    .route('/signup')
    .get(getSignupPage)
    .post(signup)

router
    .route('/login')
    .get(getLoginPage)
    .post(login)

module.exports = router
