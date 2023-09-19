const express = require('express')
const discountModel = require('./model/discount')
const bookModel = require('./model/book')
const cartModel = require('./model/cart')
const bookshopRouter = require('./routes/bookshopRoutes')
const cors = require("cors")
const databaseConnection = require('./config/database')
const dotenv = require('dotenv')
dotenv.config()

const app = express()
app.use(cors({ origin: "*" }))
app.use(express.json())
app.use(express.text())
app.use(express.urlencoded({ extended: true }))

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).send({ message: "Invalid JSON syntax!" })
  }
  next()
})



app.use("/shop", bookshopRouter)

// using route() method to get the invalid routes
app.route('*')
  .get((req, res) => {
    res.status(400).send("Invalid route!")
  })
  .put((req, res) => {
    res.status(400).send("Invalid route!")
  })
  .post((req, res) => {
    res.status(400).send("Invalid route!")
  })
  .delete((req, res) => {
    res.status(400).send("Invalid route!")
  })

databaseConnection(() => {
  app.listen(8000, () => {
    // console.log(process.env.JWT_SECRET)
    console.log("Server is running on 8000...")
  })
})

