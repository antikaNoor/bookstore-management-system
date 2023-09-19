const readerModel = require('../model/reader')
const authModel = require('../model/auth')
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
            console.log(validation)
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
            const validationErrors = validationResult(req);

            if (!validationErrors.isEmpty()) {
                return res.status(400).send(failure("Failed to edit the reader data.", validationErrors.array()));
            }

            const { readerId } = req.params;
            const { reader_name, status } = req.body;

            // Find the existing reader in the 'auth' collection
            const existingAuth = await authModel.findById(readerId);

            if (!existingAuth) {
                return res.status(400).send(failure("Reader not found."));
            }

            const matchName = existingAuth.reader_name

            // Check if the new reader name conflicts with any other existing reader
            const existingName = await authModel.findOne({
                _id: { $ne: readerId },
                reader_name
            });

            if (existingName) {
                return res.status(400).send(failure("This reader name is taken."));
            }

            // Update the 'auth' collection
            existingAuth.reader_name = reader_name;
            existingAuth.status = status;
            const updatedAuth = await existingAuth.save();

            // Update the 'reader' collection
            const existingReader = await readerModel.findOne({ reader_name: matchName });
            console.log(existingReader)

            if (existingReader) {
                existingReader.reader_name = reader_name;
                existingReader.status = status;
                await existingReader.save();
            }

            return res.status(200).send(success("Successfully updated the reader data.", updatedAuth));
        } catch (error) {
            console.error("Error:", error);
            return res.status(500).send(failure("Internal server error"));
        }
    }



    // Delete reader's data by admin
    async deleteUserData(req, res) {
        try {
            const { readerId } = req.params

            const existingAuth = await authModel.findById(readerId)
            if (!existingAuth) {
                return res.status(400).send(failure("Reader not found."))
            }
            const matchName = existingAuth.reader_name
            await authModel.findByIdAndDelete(readerId)

            await readerModel.findOneAndDelete({ reader_name: matchName });

            return res.status(200).send(success("Successfully deleted the reader's information"))


        } catch (error) {
            console.log("error found", error)
            return res.status(500).send(failure("Internal server error"))
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
}

module.exports = new readerController()