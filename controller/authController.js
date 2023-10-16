const authModel = require('../model/auth')
const readerModel = require('../model/reader')
const { success, failure } = require('../utils/success-error')
const express = require('express')
const { validationResult } = require('express-validator')
const HTTP_STATUS = require("../constants/statusCode");
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const crypto = require('crypto')
const ejs = require('ejs')
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const transporter = require('../config/mail')
const ejsRenderFile = promisify(ejs.renderFile)
const { sendMail } = require('../config/mail')


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

    //reset password
    async sendForgotPasswordEmail(req, res) {
        try {

            const { recipient } = req.body
            console.log("recipient mail", recipient)
            if (!recipient || recipient === "") {
                return res.status(400).send(failure("invalid request"))
            }

            const auth = await authModel.findOne({ reader_email: recipient })
            if (!auth) {
                return res.status(400).send(failure("invalid request"))
            }

            const resetToken = crypto.randomBytes(32).toString('hex')
            auth.resetPasswordToken = resetToken
            auth.resetPasswordExpired = new Date(Date.now() + 60 * 60 * 1000)

            await auth.save()

            const resetPasswordURL = path.join(process.env.FRONTEND_URL, "reset-password", resetToken, auth._id.toString());


            const htmlBody = await ejsRenderFile(path.join(__dirname, '../views/forgot-password.ejs'), {
                name: auth.reader_name,
                resetPasswordURL: resetPasswordURL
            })
            console.log("htmlBody", htmlBody)

            const emailResult = await sendMail(recipient, htmlBody);

            if (emailResult) {
                return res.status(200).send(success("Reset password link sent to your email"))
            }
            return res.status(400).send(failure("Something went wrong"))


        } catch (error) {
            console.log("error found", error)
            return res.status(500).send(failure("Internal server error", error))
        }
    }

    async resetPassword(req, res) {
        try {
            const { token, userId } = req.params;

            const auth = await authModel.findOne({ _id: userId, resetPasswordToken: token, resetPasswordExpired: { $gt: new Date() } });
            if (!auth) {
                return res.status(400).send(failure("invalid request"));
            }
            console.log("auth", auth)

            const { newPassword, confirmPassword } = req.body
            if (!newPassword || !confirmPassword) {
                return res.status(400).send(failure("Please enter all the fields"))
            }

            if (newPassword === auth.password) {
                console.log("newpass=oldpass")
                return res.status(400).send(failure("You are setting up an old password"));
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).send(failure("Passwords do not match"))
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10).then((hash) => {
                return hash
            })

            auth.password = hashedPassword
            auth.resetPasswordToken = null
            auth.resetPasswordExpired = null

            await auth.save()

            return res.status(200).send(success("Password reset successful"))
        } catch (error) {
            return res.status(500).send(failure("Internal server error", error))
        }
    }

    async validatePasswordResetRequest(req, res) {
        try {
            const { token, userId } = req.params;

            const auth = await authModel.findOne({ _id: new mongoose.Types.ObjectId(userId) });
            if (!auth) {
                return res.status(400).send(failure("Invalid request"))
            }

            if (auth.resetPasswordExpired < Date.now()) {
                return res.status(400).send(failure("Expired request"))
            }

            if (auth.resetPasswordToken !== token || auth.resetPassword === false) {
                return res.status(400).send(failure("Invalid token"))
            }
            return res.status(200).send(success("Request is still valid"))
        } catch (error) {
            console.log(error);
            return res.status(500).send(failure("Internal server error"))
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