const express = require('express')
const routes = express()
const { authValidator, bookValidator, discountValidator, readerEditValidator,reviewValidator } = require('../middleware/validation')
const { checkLogin, isAdmin } = require('../middleware/auth')
// const logs = require('../middleware/log')
const bookController = require("../controller/bookController")

routes.post("/add-book", bookValidator.create, checkLogin, isAdmin, bookController.add)
routes.get("/get-all-books", bookController.getAll)
routes.get("/get-book-review/:id", bookController.getOneById)
routes.patch("/edit-book/:bookId", checkLogin, isAdmin, bookController.editBookData)
routes.delete("/delete-book/:bookId", checkLogin, isAdmin, bookController.deleteBookData)

// routes.get("/get-book-by-id/:id",  bookController.getOneById)
// routes.delete("/del-book-by-id/:id", checkLogin, isAdmin,  bookController.deleteOneById)


module.exports = routes