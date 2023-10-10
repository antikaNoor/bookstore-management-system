const express = require('express')
const routes = express()
const { authValidator, bookValidator, discountValidator, readerEditValidator, reviewValidator } = require('../middleware/validation')
const { checkLogin, isAdmin, isVerified } = require('../middleware/auth')
// const logs = require('../middleware/log')
const bookController = require("../controller/bookController")

routes.post("/add-book", bookValidator.create, bookController.add)
routes.get("/get-all-books", bookController.getAll)
routes.get("/get-book-by-id/:id", bookController.getOneById)
routes.patch("/edit-book/:bookId", bookController.editBookData)
routes.delete("/delete-book/:bookId", bookController.deleteBookData)

// routes.get("/get-book-by-id/:id",  bookController.getOneById)
// routes.delete("/del-book-by-id/:id", checkLogin, isAdmin,  bookController.deleteOneById)


module.exports = routes