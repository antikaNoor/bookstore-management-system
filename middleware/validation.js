const { body } = require("express-validator")

const authValidator = {
    signup: [
        body("reader_name")
            .isString()
            .withMessage("Name must be a string.")
            .custom((value) => {
                if (value === "") {
                    throw new Error("Name cannot be empty")
                }
                return true
            }),
        body("reader_email")
            .isString()
            .withMessage("email must be a string.")
            .bail()
            .isEmail()
            .withMessage("Please enter a valid email id"),

        body("password")
            .custom((value, { req }) => {
                if (value.length < 8) {
                    throw new Error("Password must be longer than 8 characters.")
                }
                const name = req.body.reader_name.toLowerCase()
                if (value.toLowerCase().includes(name)) {
                    throw new Error("Password cannot contain parts of your name.")
                }
                const checkCapitalLetter = /[A-Z]+/
                const checkNumber = /[0-9]+/
                const checkSpecialChar = /[*@!#%&()^~{}]+/

                if (!checkCapitalLetter.test(value) || !checkNumber.test(value) || !checkSpecialChar.test(value)) {
                    throw new Error("Passowrd must contain at least one special character, one Capital letter and one number.")
                }
                return true
            }),
    ]
}

const bookValidator = {
    create: [
        body("title")
            .isString()
            .withMessage("Title must be a string.")
            .custom((value) => {
                if (value === "") {
                    throw new Error("Title cannot be empty.")
                }
                return true
            }),

        body("author")
            .isString()
            .withMessage("Author name must be a string.")
            .bail()
            .custom((value) => {
                if (value === "") {
                    throw new Error("Author name cannot be empty.")
                }
                return true
            }),
        body("price")
            .isInt()
            .withMessage("Price must be a number.")
            .bail()
            .custom((value) => {
                if (value <= 0) {
                    throw new Error("Price cannot be 0.")
                }
                return true
            }),
        body("stock")
            .isInt()
            .withMessage("Price must be a number.")
            .bail()
            .custom((value) => {
                if (value <= 0) {
                    throw new Error("Stock cannot be 0.")
                }
                return true
            })
    ],
}

const discountValidator = {
    create: [
        body("discountPercentage")
            .isInt()
            .withMessage("Percentage must be a number.")
            .bail()
            .custom((value) => {
                if (value === 100) {
                    throw new Error("100% discount cannot be applied.")
                }
                return true
            })
    ]
}

const readerEditValidator = {
    edit: [
        body("reader_name")
            .isString()
            .withMessage("Name must be a string.")
            .custom((value) => {
                if (value === "") {
                    throw new Error("Name cannot be empty")
                }
                return true
            })
    ]
}

const reviewValidator = {
    create: [
        
        body("text")
            .isString()
            .withMessage("Review text must be string.")
    ]
}

module.exports = {
    authValidator,
    bookValidator,
    discountValidator,
    readerEditValidator,
    reviewValidator
}