const express = require('express')
const routes = express()
const readerValidation = require('../middleware/readerValidation')
const { checkLogin, isAdmin } = require('../middleware/auth')
const logs = require('../middleware/log')
const reviewController = require('../controller/reviewController')


routes.post("/add-review", logs, reviewController.add)
routes.put("/update-review", checkLogin, logs, reviewController.updateReview)

module.exports = routes