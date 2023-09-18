const mongoose = require("mongoose")

const readerSchema = new mongoose.Schema({
    reader_name: {
        type: String,
        unique: true,
    },
    reader_email: {
        type: String,
        unique: true,
    },
    status: {
        type: Boolean,
        default: false
    },
    balance: {
        type: Number,
        required: [true, "Please provide a balance"]
    }

}, { timestamps: true })

const Reader = mongoose.model("Reader", readerSchema);
module.exports = Reader;