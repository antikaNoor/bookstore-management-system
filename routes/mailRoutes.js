const express = require("express");
const routes = express();
const { success, failure } = require("../utils/success-error");
// const data = require("../data/homepage");
const transporter = require("../config/mail");
const authController = require("../controller/authController");

routes.post("/send", authController.sendForgotPasswordEmail)
routes.post("/reset/:token/:userId", authController.resetPassword)
routes.post("/validate/:token/:userId", authController.validatePasswordResetRequest)

routes.get("/test", (req, res) => {
    return res.render("mail.ejs", { name: "Antika Noor" });
});

module.exports = routes;
