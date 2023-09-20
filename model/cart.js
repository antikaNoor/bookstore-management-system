const mongoose = require("mongoose")

const cartSchema = new mongoose.Schema({
    reader: {
        type: mongoose.Types.ObjectId,
        ref: "Reader",
    },
    total_spent: {
        type: Number,
    },

    bought_books: [
        {
            id: {
                type: mongoose.Types.ObjectId,
                ref: "Book"
            },
            title: {
                type: String,
                ref: "Book"
            },
            amount: {
                type: Number,
                select: false, // Exclude 'amount' field from being selected
            },
            quantity: {
                type: Number,
                default: 0
            },
            date: {
                type: Date,
                default: new Date()
            }
        }
    ]
})

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;