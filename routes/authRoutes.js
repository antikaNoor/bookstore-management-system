const express = require('express')
const routes = express()
const { authValidator, bookValidator, discountValidator, readerEditValidator, reviewValidator } = require('../middleware/validation')
// const logs = require('../middleware/log')
const AuthController = require('../controller/authController')

routes.post("/signup", authValidator.signup, AuthController.create, AuthController.signup)
routes.post("/login", AuthController.login)

module.exports = routes 