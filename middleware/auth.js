const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')
const authModel = require('../model/auth')
const readerModel = require('../model/reader')
const { success, failure } = require("../utils/success-error")
const mongoose = require("mongoose")
dotenv.config()

const checkLogin = (req, res, next) => {
    const { authorization } = req.headers
    // const { reader } = req.body
    // const existingReader = await readerModel.findById(new mongoose.Types.ObjectId(reader))
    // console.log(existingReader.reader_email)
    try {
        if (authorization) {
            const token = authorization.split(' ')[1]
            console.log(token)
            // verifying the token provided in the authorization header with the secret key in .env file
            const verified = jwt.verify(token, process.env.JWT_SECRET)

            if (verified) {
                console.log("Verified", verified.reader_email)
                next()
            }
            else {
                return res.status(400).send(failure("Authorization failed"))
            }
        }
        else {
            return res.status(400).send(failure("Authorization failed"))
        }
    } catch (error) {
        console.log("error found", error)
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(500).send(failure("Token is invalid", error))
        }
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(500).send(failure("Token is expired", error))
        }
        return res.status(500).send(failure("Internal server error"))
    }
}

const isAdmin = (req, res, next) => {
    const { authorization } = req.headers
    try {
        if (authorization) {
            const token = authorization.split(' ')[1]
            const decodedToken = jwt.decode(token, { complete: true })
            console.log(decodedToken.payload.status)
            if (decodedToken.payload.status === true) {
                next()
            }
            else {
                return res.status(400).send(failure("Only admin can add a book"))
            }
        }
        else {
            return res.status(400).send(failure("Authorization failed"))
        }
    } catch (error) {
        return res.status(500).send(failure("Internal server error"))
    }
}

const isVerified = async (req, res, next) => {
    try {
        const { authorization } = req.headers
        const { reader } = req.body
        const existingReader = await readerModel.findById(new mongoose.Types.ObjectId(reader))

        if (!existingReader) {
            return res.status(400).send(failure("Reader not found"));
        }

        const token = authorization.split(' ')[1]
        // const decodedToken = jwt.decode(token, { complete: true })

        // if (!decodedToken) {
        //     return res.status(400).send(failure("Authorization failed"));
        // }

        const verified = jwt.verify(token, process.env.JWT_SECRET)

        if (verified.reader_email === existingReader.reader_email) {
            console.log("Verified", verified.reader_email)
            next()
        }
        else {
            return res.status(400).send(failure("Authorization failed"))
        }

    } catch (error) {
        return res.status(500).send(failure("Internal server error", error))
    }
}

module.exports = {
    checkLogin,
    isAdmin,
    isVerified
}