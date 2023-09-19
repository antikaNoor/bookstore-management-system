const express = require('express')
const routes = express()
const readerValidation = require('../middleware/readerValidation')
const { checkLogin, isAdmin } = require('../middleware/auth')
const logs = require('../middleware/log')
const bookController = require("../controller/bookController")

routes.post("/add-book", checkLogin, isAdmin, logs, bookController.add)
routes.get("/get-all-books", logs, bookController.getAll)
routes.get("/get-book-by-id/:id", logs, bookController.getOneById)
routes.delete("/del-book-by-id/:id", checkLogin, isAdmin, logs, bookController.deleteOneById)

module.exports = routes