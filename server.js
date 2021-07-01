//import modules installed at the previous step. We need them to run Node.js server and send emails
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const fs = require("fs");

// create a new Express application instance
const app = express();

//configure the Express middleware to accept CORS requests and parse request body into JSON
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
    next();
});
app.use(bodyParser.json());

//start application server on heroku assigned port or port 3000 if local
app.listen(process.env.PORT || 3000)

// define a sendmail endpoint, which will send emails and response with the corresponding status
app.post("/sendmail", (req, res) => {
    console.log("request came");
    let emailReq = req.body;
    sendMail(emailReq, (err, info) => {
        if (err) {
            console.log(err);
            res.status(400);
            res.send({ error: "Failed to send email" });
        } else {
            console.log("Email has been sent");
            res.send(info);
        }
    });
});

const sendMail = (emailReq, callback) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: "noreply@logyourworkout.app",
            pass: "a34DJ8`8"
        }
    });

    fs.writeFile(`${emailReq.subject}.pdf`, emailReq.attachments[0], 'base64', error => {
        if (error) {
            throw error;
        } else {
            console.log('base64 saved!');
        }
    });

    let mailOptions = {
        from: emailReq.fromEmailAddress,
        to: emailReq.toEmailAddress,
        subject: emailReq.subject,
        html: emailReq.body,
        attachments: [{
            filename: `${emailReq.subject}.pdf`,
            path: '\./' + `${emailReq.subject}.pdf`,
            contentType: 'application/pdf'
        }]
    }

    transporter.sendMail(mailOptions, callback);
};