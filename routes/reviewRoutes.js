const express = require('express')
const routes = express()
const readerValidation = require('../middleware/validation')
const { checkLogin, isAdmin } = require('../middleware/auth')
// const logs = require('../middleware/log')
const reviewController = require('../controller/reviewController')


routes.post("/add-review", reviewController.add)
routes.put("/update-review", checkLogin, reviewController.updateReview)

module.exports = routes