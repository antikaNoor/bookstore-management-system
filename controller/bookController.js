const bookModel = require('../model/book')
const reviewModel = require('../model/review')
const { success, failure } = require('../utils/success-error')
const express = require('express')
const { validationResult } = require('express-validator')
const fileTypes = require("../constants/fileTypes")
const fs = require('fs')
const path = require('path')

class bookController {

    // validation
    async create(req, res, next) {
        try {
            const validation = validationResult(req).array()
            if (validation.length > 0) {
                return res.status(400).send(failure("Validation"))
            }
            next()
        } catch (error) {
            return res.status(500).send(failure("internal server error."))
        }
    }

    // add files using multer
    async uploadFiles(req, res) {
        try {
            if (!fileTypes.includes(req.file_extention)) {
                return res.status(400).send(failure("Invalid file type"))
            }
            if (!req.file) {
                return res.status(400).send(failure("No file found"))
            }

            // console.log("filename", req.file.file)
            const commonPrefix = 'D:\\MERN_Antika_Noor\\backendForReact\\expressJs-practice-filter-fixed\\server\\';
            const fileName = req.file.path.replace(commonPrefix, '');
            return res.status(200).send(success("Successfully uploaded the file", fileName))
        } catch (error) {
            console.error("Error while entering file:", error);
            return res.status(500).send(failure("internal server error."))
        }
    }

    //get the file
    async getFile(req, res) {
        try {
            const { filepath } = req.params;
            const exists = fs.existsSync(path.join(__dirname, "..", "server", filepath));

            if (!exists) {
                return res.status(400).send(failure("No file found"))
            }
            console.log("filepath", filepath)
            return res.status(200).sendFile(path.join(__dirname, "..", "server", filepath));
        } catch (error) {
            console.log(error);
            return res.status(500).send(failure("Internal server error."))
        }
    }

    //add data
    async add(req, res) {
        try {
            const validation = validationResult(req).array()
            if (validation.length > 0) {
                console.log("validation error", validation)
                return res.status(400).send(failure("Failed to add the book", validation))
            }

            const { title, author, genre, description, pages, price, stock, branch } = req.body

            if (!price || !stock) {
                return res.status(400).send(failure("Price and stock must be provided"))
            }

            const { image } = req.body;

            let existingBook = await bookModel.findOne({ title, author })
            if (existingBook) {
                return res.status(400).send(failure("This book already exists!"))
            }
            const book = new bookModel({ title, author, genre, description, pages, price, stock, branch, image })
            console.log(book)
            await book.save()

            return res.status(200).send(success("Successfully added the book"))
        } catch (error) {
            console.error("Error while entering book:", error);
            return res.status(500).send(failure("internal server error."))
        }
    }

    //get all data
    async getAll(req, res) {
        try {
            let { page, limit, sortParam, sortOrder, pagesMin, pagesMax, priceMin, priceMax, ratingMin, ratingMax, stockMin, stockMax, search } = req.query

            let result = 0
            // Total number of records in the whole collection
            const totalRecords = await bookModel.countDocuments({})

            if (!page || !limit) {
                page = 1
                limit = 6
            }

            if (page < 1 || limit < 0) {
                return res.status(400).send(failure("Page must be at least 1 and limit must be at least 0"))
            }

            // sorting
            if (
                (sortParam && !sortOrder) ||
                (!sortParam && sortOrder) ||
                (sortParam && sortParam !== "pages" && sortParam !== "price" && sortParam !== "stock" && sortParam !== "rating") ||
                (sortOrder && sortOrder !== "asc" && sortOrder !== "desc")
            ) {
                return res.status(400).send(failure("Invalid sort parameters provided."));
            }

            // Filtering
            const filter = {}
            if (priceMin && priceMax) {
                if (priceMin > priceMax) {
                    return res.status(400).send(failure("Minimum price cannot be greater than maximum price."));
                }
                filter.price = {
                    $gte: parseFloat(priceMin),
                    $lte: parseFloat(priceMax)
                }

            }
            if (priceMin && !priceMax) {
                filter.price = { $gte: parseFloat(priceMin) }

            }
            if (!priceMin && priceMax) {
                filter.price = { $lte: parseFloat(priceMax) }

            }
            if (pagesMin && pagesMax) {
                if (pagesMin > pagesMax) {
                    return res.status(400).send(failure("Minimum pages cannot be greater than maximum pages."));
                }
                filter.pages = {
                    $gte: parseFloat(pagesMin),
                    $lte: parseFloat(pagesMax)
                }

            }
            if (pagesMin && !pagesMax) {
                filter.pages = { $gte: parseFloat(pagesMin) }

            }
            if (!pagesMin && pagesMax) {
                filter.pages = { $lte: parseFloat(pagesMax) }

            }
            if (stockMin && stockMax) {
                if (stockMin > stockMax) {
                    return res.status(400).send(failure("Minimum stock cannot be greater than maximum stock."));
                }
                filter.stock = {
                    $gte: parseFloat(stockMin),
                    $lte: parseFloat(stockMax)
                }

            }
            if (stockMin && !stockMax) {
                filter.stock = { $gte: parseFloat(stockMin) }

            }
            if (!stockMin && stockMax) {
                filter.stock = { $lte: parseFloat(stockMax) }

            }

            if (ratingMin && ratingMax) {
                if (ratingMin > ratingMax) {
                    return res.status(400).send(failure("Minimum rating cannot be greater than maximum rating."));
                }
                filter.rating = {
                    $gte: parseFloat(ratingMin),
                    $lte: parseFloat(ratingMax)
                }

            }
            if (ratingMin && !ratingMax) {
                filter.rating = { $gte: parseFloat(ratingMin) }

            }
            if (!ratingMin && ratingMax) {
                filter.rating = { $lte: parseFloat(ratingMax) }

            }

            // search
            if (search) {
                filter["$or"] = [
                    { title: { $regex: search, $options: "i" } },
                    { author: { $regex: search, $options: "i" } },
                    { genre: { $regex: search, $options: "i" } }
                ];
            }

            // Pagination
            result = await bookModel.find(filter)
                .sort(sortParam ? {
                    [sortParam]: sortOrder === "asc" ? 1 : -1,
                } : {
                    _id: 1
                })
                .skip((page - 1) * limit)
                .limit(limit)
                .select('-__v -reviews -discounts')


            if (result.length > 0) {
                const paginationResult = {
                    books: result,
                    totalInCurrentPage: result.length,
                    currentPage: parseInt(page),
                    totalRecords: totalRecords
                }
                return res
                    .status(200)
                    .send(success("Successfully received all books", paginationResult));
            }
            return res.status(400).send(failure("No book was found"));

        } catch (error) {
            return res.status(500).send(failure("internal server error."))
        }
    }

    // Edit existing book data
    async editBookData(req, res) {
        try {
            const { bookId } = req.params

            const { title, author, genre, description, pages, price, stock, branch, image } = req.body
            const existingBook = await bookModel.findById(bookId)
            if (!existingBook) {
                return res.status(400).send(failure("Book not found."))
            }
            const duplicateBook = await bookModel.findOne({
                _id: { $ne: bookId },
                title,
                author
            })

            if (duplicateBook) {
                return res.status(400).send(failure("Book already exists."))
            }
            const updatedBook = {
                title, author, genre, description, pages, price, stock, branch
            }
            const result = await bookModel.findOneAndUpdate(
                { _id: bookId }, // Find by _id
                updatedBook, // Update with the new data
                { new: true }
            );
            if (!result) {
                return res.status(400).send(failure("Can't find the book"))
            }
            return res.status(200).send(success("Successfully updated the book", result))


        } catch (error) {
            console.log("error found", error)
            return res.status(500).send(failure("Internal server error"))
        }
    }

    // Delete book data by admin
    async deleteBookData(req, res) {
        try {
            const { bookId } = req.params

            const existingBook = await bookModel.findById(bookId)
            if (!existingBook) {
                return res.status(400).send(failure("Book not found."))
            }
            await bookModel.findByIdAndDelete(bookId)

            return res.status(200).send(success("Successfully deleted the book information"))


        } catch (error) {
            console.log("error found", error)
            return res.status(500).send(failure("Internal server error"))
        }
    }

    //get one data by id
    async getOneById(req, res) {
        console.log(req.params)
        try {
            const { id } = req.params;
            const result = await bookModel.findById({ _id: id })
            // .select("title author -_id")
            // .populate({
            //     path: "reviews",
            //     select: "reader rating text -_id",
            //     populate: {
            //         path: "reader",
            //         select: "reader_name -_id",
            //     },
            // });
            if (!result) {
                return res.status(400).send(failure("Can't find the book"))
            }
            return res.status(200).send(success("Successfully received the book", result))


        } catch (error) {
            return res.status(500).send(failure("Internal server error"))
        }
    }
}

module.exports = new bookController()