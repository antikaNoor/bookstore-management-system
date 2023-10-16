const nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "0f51ef644b5230",
        pass: "55b699a45e9fee"
    }
});

const sendMail = async (recipientEmail, htmlBody) => {
    try {

        const result = await transporter.sendMail({
            from: "antika.noor@bjitacademy.com",
            to: recipientEmail,
            subject: "Forgot Password?",
            html: htmlBody,
        });

        console.log("Email sent successfully:", result);
        return result;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

module.exports = {
    sendMail
}