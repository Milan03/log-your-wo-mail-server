require('dotenv').config();
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    const emailReq = JSON.parse(event.body);
    const result = await sendMail(emailReq);

    if (result.error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Failed to send email" }),
        };
    } else {
        return {
            statusCode: 200,
            body: JSON.stringify(result.info),
        };
    }
};

const sendMail = (emailReq) => {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS
            }
        });

        const pdfPath = path.join('/tmp', `${emailReq.subject}.pdf`);

        fs.writeFile(pdfPath, emailReq.attachments[0], 'base64', error => {
            if (error) {
                console.log('Error saving file:', error);
                return reject({ error });
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

                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.log(err);
                        reject({ error: err });
                    } else {
                        console.log("Email has been sent");
                        resolve({ info });
                    }
                });
            }
        });
    });
};