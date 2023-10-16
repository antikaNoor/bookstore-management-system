const express = require('express')
const authRouter = require('./routes/authRoutes')
const bookRouter = require('./routes/bookRoutes')
const cartRouter = require('./routes/cartRoutes')
const discountRouter = require('./routes/discountRoutes')
const readerRouter = require('./routes/readerRoutes')
const reviewRouter = require('./routes/reviewRoutes')
const mailRoutes = require('./routes/mailRoutes')
const cors = require("cors")
const databaseConnection = require('./config/database')
const dotenv = require('dotenv')
dotenv.config()
const fs = require('fs')
const path = require('path')
const morgan = require('morgan')

const logFile = fs.createWriteStream(
  path.join(__dirname, "logFile.log"),
  { flags: "a" }
)

const app = express()
app.use(cors({ origin: "*" }))
// app.use(cors())
app.use(express.json())
app.use(express.text())
app.use(express.urlencoded({ extended: true }))

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).send({ message: "Invalid JSON syntax!" })
  }
  next()
})

app.use(morgan("combined", {
  stream: logFile
}))

app.use("/auth", authRouter)
app.use("/book", bookRouter)
app.use("/cart", cartRouter)
app.use("/discount", discountRouter)
app.use("/reader", readerRouter)
app.use("/review", reviewRouter)
app.use("/mail", mailRoutes);

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

