const multer = require('multer')
const fileTypes = require("../constants/fileTypes")
const path = require('path')

const upload = multer({
    limits: {
        fileSize: 1000000 / 2
    },

    storage: multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, path.join(__dirname, "../server"))
        },
        filename: function (req, file, callback) {
            callback(null, Date.now() + path.extname(file.originalname))
        }
    }),

    fileFilter: function (req, file, callback) {
        if (file) {
            const extention = path.extname(file.originalname)
            req.file_extention = extention

            if (fileTypes.includes(extention)) {
                callback(null, true)
            } else {
                callback(null, false)
            }
        }
        else {
            callback("No files found", false)
        }
    }
})

module.exports = { upload }