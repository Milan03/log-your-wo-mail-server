// Import modules
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Create a new Express application instance
const app = express();

// Configure the Express middleware to accept CORS requests and parse request body into JSON
app.use(cors({
    origin: true,
    credentials: true,
    methods: 'POST,GET,PUT,OPTIONS,DELETE'
}));
app.use(bodyParser.json());

// Start application server on Heroku assigned port or port 3000 if local
app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});

// Define a sendmail endpoint, which will send emails and respond with the corresponding status
app.post("/sendmail", (req, res) => {
    console.log("request came");
    let emailReq = req.body;
    sendMail(emailReq, (err, info) => {
        if (err) {
            console.log(`${process.env.EMAIL}`);
            console.log(`${process.env.EMAIL_PASS}`);
            console.log(err);
            res.status(400).send({ error: "Failed to send email" });
        } else {
            console.log("Email has been sent");
            res.send(info);
        }
    });
});

// Function to send email
const sendMail = (emailReq, callback) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL, // Use environment variables
            pass: process.env.EMAIL_PASS // Use environment variables
        }
    });

    const pdfPath = path.join(__dirname, `${emailReq.subject}.pdf`);

    fs.writeFile(pdfPath, emailReq.attachments[0], 'base64', error => {
        if (error) {
            console.log('Error saving file:', error);
            return callback(error);
        } else {
            console.log('Base64 saved!');
            let mailOptions = {
                from: emailReq.fromEmailAddress,
                to: emailReq.toEmailAddress,
                subject: emailReq.subject,
                html: emailReq.body,
                attachments: [{
                    filename: `${emailReq.subject}.pdf`,
                    path: pdfPath,
                    contentType: 'application/pdf'
                }]
            };

            transporter.sendMail(mailOptions, callback);
        }
    });
};