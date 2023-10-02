const express = require('express')
const routes = express()
const { checkLogin, isAdmin, isVerified } = require('../middleware/auth')
const readerValidation = require('../middleware/validation')
// const logs = require('../middleware/log')
const cartController = require("../controller/CartController")

routes.post("/add-to-cart", checkLogin, isVerified, cartController.add) //OK
routes.patch("/delete-from-cart", checkLogin, isVerified, cartController.delete) //OK
routes.post("/checkout", checkLogin, cartController.checkOut)
routes.get("/show-my-cart", checkLogin, cartController.showCart)
routes.get("/show-my-transaction", checkLogin, cartController.showTransaction)

routes.get("/get-all-cart", checkLogin, isAdmin, cartController.getAllCarts)
routes.get("/get-transaction", checkLogin, isAdmin, cartController.getAllTransactions)


module.exports = routes