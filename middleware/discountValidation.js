const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')
const authModel = require('../model/auth')
const readerModel = require('../model/reader')
const { success, failure } = require("../utils/success-error")
const { validationResult } = require('express-validator');

dotenv.config()

const checkDiscount = (req, res, next) => {
    try {
        const { discountPercentage } = req.body;
        const discountArray = [10, 25, 30, 40]

        const matchedDiscount = discountArray.map((discount) => discount === discountPercentage)

        // Check for validation errors
        console.log(matchedDiscount)
        if (!matchedDiscount.some((isMatch) => isMatch)) {
            return res.status(400).send(failure("Please choose discount from the following - 10, 25, 30, 40."));
        }

        next()
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

module.exports = checkDiscount