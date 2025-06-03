const express = require('express')
const router = express.Router()

const { getHome } = require('../controller/user')
const { ifUserLoggedIn } = require('../middleware/loginVerifier')

router
    .route('/')
    .get(ifUserLoggedIn, getHome)

module.exports = router