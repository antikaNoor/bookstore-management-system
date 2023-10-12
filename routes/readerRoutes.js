const express = require('express')
const routes = express()
const { authValidator, bookValidator, discountValidator, readerEditValidator, reviewValidator } = require('../middleware/validation')
const { checkLogin, isAdmin, isVerified } = require('../middleware/auth')
// const logs = require('../middleware/log')
const readerController = require('../controller/readerController')

routes.put("/update-balance", checkLogin, readerController.updateByUser)
routes.get("/check-balance", checkLogin, readerController.viewBalance)
routes.get("/get-user-info", checkLogin, isAdmin, readerController.viewUserData)
routes.patch("/edit-reader/:readerId", readerEditValidator.edit, checkLogin, isAdmin, readerController.editUserData)
routes.delete("/delete-reader/:readerId", checkLogin, isAdmin, readerController.deleteUserData)
routes.get("/get-reader/:id", checkLogin, isAdmin, readerController.getOneById)

module.exports = routes