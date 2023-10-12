const authModel = require('../model/auth')
const readerModel = require('../model/reader')
const { success, failure } = require('../utils/success-error')
const express = require('express')
const { validationResult } = require('express-validator')
const HTTP_STATUS = require("../constants/statusCode");
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

class AuthController {

    // validation
    async create(req, res, next) {
        try {
            const validation = validationResult(req).array()
            if (validation.length > 0) {
                return res.status(400).send({ message: "validation error", validation })
            }
            next()
        } catch (error) {
            console.log("error has occured")
        }
    }

    // login
    async login(req, res) {
        try {
            const { reader_email, password } = req.body
            const auth = await authModel.findOne({ reader_email })

            if (!auth) {
                return res.status(400).send(failure("Reader is not registered"))
            }

            const currentTime = new Date()
            // the future time when a user can log in again is saved in timeToLogin which is 15 seconds following the last updateAt value.
            const timeToLogin = new Date(auth.updatedAt.getTime() + 15 * 1000);
            if (auth.loginAttempt >= 3) {
                console.log("Too many failed login attempts. Try again in " + (timeToLogin - currentTime) / 1000 + " seconds")
                if (timeToLogin - currentTime > 0) {
                    return res.status(401).send(failure(`Too many login attempts. Try again in ${(timeToLogin - currentTime) / 1000} seconds.`));
                }
                auth.loginAttempt = 0;
                await auth.save();
            }
            // if user tries to log in with wrong password, the loginAttempt property will increase 
            auth.loginAttempt++
            await auth.save()

            const checkPassword = await bcrypt.compare(password, auth.password)
            console.log(checkPassword)

            if (!checkPassword) {
                return res.status(400).send(failure("Authentication failed"))
            }

            // If the password is right, the loginAttempt property will be 0
            auth.loginAttempt = 0;
            await auth.save();

            const responseAuth = auth.toObject()

            delete responseAuth.password
            delete responseAuth.loginAttempt
            // delete responseAuth.reader
            delete responseAuth.__v
            delete responseAuth.createdAt
            delete responseAuth.updatedAt

            const generatedToken = jwt.sign(responseAuth, process.env.JWT_SECRET, {
                expiresIn: "20d"
            })

            responseAuth.token = generatedToken

            return res.status(200).send(success("Login successful", responseAuth))
        } catch (error) {
            return res.status(500).send(failure("Internal server error", error))
        }
    }

    // sign up
    async signup(req, res) {
        try {
            const validation = validationResult(req).array()
            if (validation.length > 0) {
                return res.status(400).send(failure("Failed to add the user", validation))
            }

            const { reader_name, reader_email, password, status, balance } = req.body
            const existingReader = await authModel.findOne({ reader_name, reader_email })

            if (existingReader) {
                return res.status(400).send(failure("This reader is already registered."))
            }
            const hashedPassword = await bcrypt.hash(password, 10).then((hash) => {
                return hash
            })

            const readerInfo = await readerModel.create({
                reader_name: reader_name,
                reader_email: reader_email,
                status: status,
                balance: balance
            })

            const result = await authModel.create({
                reader_name: reader_name,
                reader_email: reader_email,
                password: hashedPassword,
                // balance: balance,
                reader: readerInfo._id
            })

            const responseAuth = result.toObject()

            delete responseAuth.password
            delete responseAuth._id
            delete responseAuth.loginAttempt
            delete responseAuth.reader
            delete responseAuth.__v
            delete responseAuth.createdAt
            delete responseAuth.updatedAt

            return res.status(200).send(success("Successfully added the user", responseAuth))
        } catch (error) {
            return res.status(500).send(failure("Internal server error", error))
        }
    }
}

module.exports = new AuthController()