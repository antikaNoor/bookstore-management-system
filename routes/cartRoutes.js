const express = require('express')
const routes = express()
const { checkLogin, isAdmin } = require('../middleware/auth')
const readerValidation = require('../middleware/readerValidation')
const logs = require('../middleware/log')
const cartController = require("../controller/CartController")

routes.post("/add-to-cart", checkLogin, logs, cartController.add) //OK
routes.patch("/delete-from-cart", logs, cartController.delete) //OK
routes.post("/checkout", checkLogin, logs, cartController.checkOut)
routes.get("/get-all-cart", logs, cartController.getAll)
routes.get("/show-my-cart", logs, cartController.showCart)
routes.get("/show-my-transaction", checkLogin, logs, cartController.showTransaction)
routes.get("/get-transaction", logs, cartController.getAll)


module.exports = routes