const readerModel = require('../model/reader')
const { success, failure } = require('../utils/success-error')
const express = require('express')
const { validationResult } = require('express-validator')
const HTTP_STATUS = require("../constants/statusCode");
const bcrypt = require("bcrypt")
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

class readerController {

    async updateByUser(req, res) {
        try {
            const { authorization } = req.headers
            const { balance } = req.body

            const token = authorization.split(' ')[1]
            const decodedToken = jwt.decode(token, { complete: true })

            const readerIdFromToken = decodedToken.payload.reader
            const existingReader = await readerModel.findOne(new mongoose.Types.ObjectId(readerIdFromToken))

            if (!existingReader) {
                return res.status(400).send(failure("Reader not found!"))
            }
            existingReader.balance += balance
            existingReader.save()
            return res.status(200).send(success("Successfully updated the balance.", existingReader))
            // console.log(existingReader.balance)
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                return res.status(500).send(failure("Token is invalid", error))
            }
            if (error instanceof jwt.TokenExpiredError) {
                return res.status(500).send(failure("Token is expired", error))
            }
            return res.status(500).send(failure("Internal server error", error))
        }
    }
    // admin can view all user data
    async viewUserData(req, res) {
        try {
            const result = await readerModel.find({})
                .select('-_id -updatedAt -__v')
            console.log(result)

            return res.status(200).send(success("Successfully got all user data", result))

        } catch (error) {
            res.status(500).send(failure(error.message))
        }
    }

    // Edit existing user data
    async editUserData(req, res) {
        try {
            const { readerId } = req.params

            const { reader_name, reader_email, status, balance } = req.body
            const existingReader = await readerModel.findById(readerId)
            if (!existingReader) {
                return res.status(400).send(failure("Reader not found."))
            }
            const existingName = await readerModel.findOne({
                _id: { $ne: readerId },
                reader_name
            })
            const existingEmail = await readerModel.findOne({
                _id: { $ne: readerId },
                reader_email
            })

            if (existingName || existingEmail) {
                return res.status(400).send(failure("This reader-name/ email is taken."))
            }
            const updatedReader = {
                reader_name,
                reader_email,
                status,
                balance
            }
            const result = await readerModel.findOneAndUpdate(
                { _id: readerId }, // Find by _id
                updatedReader, // Update with the new data
                { new: true }
            );
            console.log(result)
            if (!result) {
                return res.status(400).send(failure("Can't find the reader"))
            }
            return res.status(200).send(success("Successfully updated the reader", result))


        } catch (error) {
            console.log("error found", error)
            res.status(500).send(failure("Internal server error"))
        }
    }

    // Delete reader's data by admin
    async deleteUserData(req, res) {
        try {
            const { readerId } = req.params
            const { reader_name, reader_email, status, balance } = req.body

            const existingReader = await readerModel.findById(readerId)
            if (!existingReader) {
                return res.status(400).send(failure("Reader not found."))
            }
            await readerModel.findByIdAndDelete(readerId)

            return res.status(200).send(success(`Successfully deleted the ${reader_name}'s information`))


        } catch (error) {
            console.log("error found", error)
            res.status(500).send(failure("Internal server error"))
        }
    }

    //get one data by id
    async getOneById(req, res) {
        try {
            const { id } = req.params; // Retrieve the id from req.params
            // console.log(id);
            const result = await readerModel.findById({ _id: id })
            // console.log(result)
            if (result) {
                res.status(200).send(success("Successfully received the reader", result))
            } else {
                res.status(200).send(failure("Can't find the reader"))
            }

        } catch (error) {
            console.log("error found", error)
            res.status(500).send(failure("Internal server error"))
        }
    }

    //delete data by id
    async deleteOneById(req, res) {
        try {
            const { id } = req.params; // Retrieve the id from req.params
            // console.log(id);
            const result = await readerModel.findOneAndDelete({ _id: id })
            // console.log(result)
            if (result) {
                res.status(200).send(success("Successfully deleted the reader", result))
            } else {
                res.status(200).send(failure("Can't find the reader"))
            }

        } catch (error) {
            console.log("error found", error)
            res.status(500).send(failure("Internal server error"))
        }
    }


}

module.exports = new readerController()