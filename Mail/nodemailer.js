require("dotenv").config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false, // Ignore certificate validation
    },
});



module.exports = {
    send: async (mail,otp,data) => {
        return new Promise(function (resolve, reject) {
            let mailOptions = {
                from: process.env.MAIL_USER, // sender address
                to:mail, // list of receivers
                subject: "OTP Verification",
                html: `<html><body><p>OTP is <h2>${otp}</h2> for ${data} on AGNI Software Solution. Do not share this OTP with anyone for security reasons.</p></body></html>`, // html body
            };
            transporter.sendMail(mailOptions, function (err, result) {
                if (err) {
                    reject([])
                }
                else if (result) {
                    resolve(result)
                }
            });
        })
    }
}