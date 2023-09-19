const express = require('express')
const routes = express()
const readerValidation = require('../middleware/readerValidation')
const { checkLogin, isAdmin } = require('../middleware/auth')
const logs = require('../middleware/log')
const readerController = require('../controller/readerController')

routes.put("/update-balance", checkLogin, logs, readerController.updateByUser)
routes.get("/get-user-info", checkLogin, isAdmin, logs, readerController.viewUserData)
routes.patch("/edit-reader/:readerId", checkLogin, isAdmin, logs, readerController.editUserData)

module.exports = routes