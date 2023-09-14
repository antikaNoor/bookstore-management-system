const express = require('express')
const routes = express()
const readerValidation = require('../middleware/readerValidation')
const { checkLogin, isAdmin, isVerified } = require('../middleware/auth')
const logs = require('../middleware/log')
const AuthController = require('../controller/authController')
const readerController = require('../controller/readerController')
const bookController = require("../controller/bookController")
const cartController = require("../controller/CartController")
const authController = require('../controller/authController')
const reviewController = require('../controller/reviewController')
const Auth = require('../model/auth')

routes.post("/signup", readerValidation.signup, AuthController.create, logs, AuthController.signup)
routes.post("/login", AuthController.login)
routes.post("/refresh", checkLogin, logs, authController.refresh)

routes.post("/add-book", checkLogin, isAdmin, logs, bookController.add)
routes.get("/get-all-books", logs, bookController.getAll)
routes.get("/get-book-by-id/:id", logs, bookController.getOneById)
routes.delete("/del-book-by-id/:id", checkLogin, isAdmin, logs, bookController.deleteOneById)

routes.post("/add-reader", readerValidation.create, readerController.create, logs, readerController.add)

routes.post("/add-to-cart", isVerified, logs, cartController.add) //OK
routes.patch("/delete-from-cart", isVerified, logs, cartController.delete) //OK
routes.post("/checkout", isVerified, logs, cartController.checkOut)
routes.get("/get-all-cart", logs, cartController.getAll)
routes.get("/get-cart-by-id", checkLogin, isVerified, logs, cartController.getOneById)

routes.get("/get-transaction", logs, cartController.getAll)

routes.post("/review", isVerified, logs, reviewController.add)

module.exports = routes