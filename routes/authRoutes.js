const express = require('express')
const routes = express()
const readerValidation = require('../middleware/readerValidation')
const logs = require('../middleware/log')
const AuthController = require('../controller/authController')

routes.post("/signup", readerValidation.signup, AuthController.create, logs, AuthController.signup)
routes.post("/login", AuthController.login)

module.exports = routes