const express = require('express')
const routes = express()
const { checkLogin, isAdmin } = require('../middleware/auth')
const readerValidation = require('../middleware/validation')
// const logs = require('../middleware/log')
const cartController = require("../controller/CartController")

routes.post("/add-to-cart", checkLogin, cartController.add) //OK
routes.patch("/delete-from-cart", cartController.delete) //OK
routes.post("/checkout", checkLogin, cartController.checkOut)
routes.get("/get-all-cart", cartController.getAll)
routes.get("/show-my-cart", cartController.showCart)
routes.get("/show-my-transaction", checkLogin, cartController.showTransaction)
routes.get("/get-transaction", cartController.getAll)


module.exports = routes