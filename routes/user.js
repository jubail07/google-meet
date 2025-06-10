const express = require('express')
const router = express.Router()

const { getHome, logout } = require('../controller/user')
const { ifUserLoggedIn } = require('../middleware/loginVerifier')

router
    .route('/')
    .get(ifUserLoggedIn, getHome)

router
    .route('/logout')
    .get(logout)

module.exports = router