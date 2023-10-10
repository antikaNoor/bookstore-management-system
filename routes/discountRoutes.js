const express = require('express')
const routes = express()
const { authValidator, bookValidator, discountValidator, readerEditValidator } = require('../middleware/validation')
const { checkLogin, isAdmin, isVerified } = require('../middleware/auth')
const logs = require('../middleware/log')
const discountController = require('../controller/discountController')

routes.post("/add-discount", discountValidator.create, checkLogin, isAdmin, discountController.add)
routes.patch("/update-discount", checkLogin, isAdmin, discountController.update)

module.exports = routes