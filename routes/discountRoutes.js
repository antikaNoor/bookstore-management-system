const express = require('express')
const routes = express()
const readerValidation = require('../middleware/readerValidation')
const { checkLogin, isAdmin } = require('../middleware/auth')
const logs = require('../middleware/log')
const discountController = require('../controller/discountController')

routes.post("/add-discount", checkLogin, isAdmin, logs, discountController.add)
routes.patch("/update-discount", checkLogin, isAdmin, logs, discountController.update)

module.exports = routes