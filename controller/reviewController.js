const bookModel = require('../model/book')
const readerModel = require('../model/reader')
const reviewModel = require('../model/review')
const { success, failure } = require('../utils/success-error')
const express = require('express')
const { validationResult } = require('express-validator')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

class reviewClass {
    //add data
    async add(req, res) {
        try {

            const validation = validationResult(req).array()
            if (validation.length > 0) {
                console.log("validation error", validation)
                return res.status(400).send(failure("Failed to add the review", validation))
            }

            const { book, reader, rating, text } = req.body

            if (!book) {
                return res.status(400).send(failure("Please enter a valid book id."))
            }

            try {
                let existingBook = await bookModel.findById(new mongoose.Types.ObjectId(book))
                let existingReader = await readerModel.findById(new mongoose.Types.ObjectId(reader))
                const existingReview = await reviewModel.findOne({ book, reader })

                if (existingReview) {
                    return res.status(400).send(failure("You have already added a review for this book. Please update it."))
                }
                if ((!existingBook && !existingReader) || (!existingBook && existingReader) || (existingBook && !existingReader)) {
                    return res.status(400).send(failure("Please provide a valid book or/and reader id."))
                }
                const review = new reviewModel({ book, reader, rating, text })

                await review.save()
                // Update the book's rating and get the new average rating
                const reviews = await reviewModel.find({ book, rating: { $exists: true } }); // Only consider reviews with a rating property
                let totalRating = 0;
                let numberOfReviewsWithRatings = 0;

                for (const rev of reviews) {
                    totalRating += rev.rating;
                    numberOfReviewsWithRatings++;
                }

                // to avoid divide by zero error
                const averageRating = numberOfReviewsWithRatings > 0 ? totalRating / numberOfReviewsWithRatings : 0;

                // Update the book's rating
                await bookModel.findByIdAndUpdate(book, {
                    rating: averageRating,
                    $push: { reviews: review._id } // Add the review ID to the reviews array
                });

                console.log(`Average rating updated for book ${book} to ${averageRating}`)

                const responseRev = review.toObject()

                delete responseRev._id
                delete responseRev.__v

                return res.status(200).send(success("Successfully added the review", responseRev))
            } catch (bsonError) {
                // Handle the BSONError and send a custom error response
                return res.status(400).send(failure("Invalid book or/ and reader ID."));
            }


        } catch (error) {
            console.error("Error while entering review:", error);
            return res.status(500).send(failure("internal server error."))
        }
    }

    // remove rating
    async updateReview(req, res) {
        try {
            const { authorization } = req.headers
            const { book, rating, text } = req.body

            const token = authorization.split(' ')[1]
            const decodedToken = jwt.decode(token, { complete: true })

            const readerIdFromToken = decodedToken.payload.reader_name

            const existingReader = await readerModel.findOne({ reader_name: readerIdFromToken })
            const existingReview = await reviewModel.findOne({ reader: existingReader._id, book: book })

            // Check if the review exists
            if (!existingReview) {
                return res.status(400).send(failure("Review not found."));
            }


            // if the rating is already removed by the reader
            if (!rating && !text) {
                // Remove the review ID from the associated book document
                await bookModel.findByIdAndUpdate(
                    book,
                    { $pull: { reviews: existingReview._id } },
                    { new: true } // This option returns the updated document
                );

                // Remove the review document
                await reviewModel.deleteOne({ _id: existingReview._id });

                // Calculate new average rating and update the book's rating
                const reviews = await reviewModel.find({ book, rating: { $exists: true } });
                let totalRating = 0;
                let numberOfReviewsWithRatings = 0;

                for (const rev of reviews) {
                    totalRating += rev.rating;
                    numberOfReviewsWithRatings++;
                }

                // Calculate new average rating
                const averageRating = numberOfReviewsWithRatings > 0 ? totalRating / numberOfReviewsWithRatings : 0;

                // Update the book's rating
                await bookModel.findByIdAndUpdate(book, { rating: averageRating });

                console.log(`Average rating updated for book ${book} to ${averageRating}`);

                return res.status(200).send(success("You removed the rating and the review. The review is deleted."));
            }

            existingReview.rating = rating
            existingReview.text = text
            await existingReview.save()

            // Update the book's rating and get the new average rating
            const reviews = await reviewModel.find({ book, rating: { $exists: true } }); // Only consider reviews with a rating property
            let totalRating = 0;
            let numberOfReviewsWithRatings = 0;

            for (const rev of reviews) {
                totalRating += rev.rating;
                numberOfReviewsWithRatings++;
            }

            // to avoid divide by zero error
            const averageRating = numberOfReviewsWithRatings > 0 ? totalRating / numberOfReviewsWithRatings : 0;

            // Update the book's rating
            await bookModel.findByIdAndUpdate(book, {
                rating: averageRating
            });

            console.log(`Average rating updated for book ${book} to ${averageRating}`)

            const responseRev = existingReview.toObject()

            delete responseRev._id
            delete responseRev.__v

            return res.status(200).send(success("Successfully updated the review", responseRev))

        } catch (error) {
            console.log("error found", error)
            return res.status(500).send(failure("Internal server error"))
        }
    }

    //see all reviews
    async showReviews(req, res) {
        try {
            const { authorization } = req.headers

            const token = authorization.split(' ')[1]
            const decodedToken = jwt.decode(token, { complete: true })

            const readerIdFromToken = decodedToken.payload.reader_name

            const existingReader = await readerModel.findOne({ reader_name: readerIdFromToken })
            console.log("existingReader", existingReader)
            const existingReview = await reviewModel.find({ reader: existingReader._id })
                .populate("book")

            if (!existingReview) {
                return res.status(400).send(failure("You have not added any review."))
            }
            console.log(existingReview)
            // const responseCart = existingTransaction.toObject()

            // delete responseCart._id
            // delete responseCart.__v
            return res.status(200).send(success("Got the data from transaction.", existingReview))


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

}

module.exports = new reviewClass()