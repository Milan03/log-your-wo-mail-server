const nodemailer = require('nodemailer');

const MAX_PDF_BYTES = 4 * 1024 * 1024;

class EmailRequestError extends Error {}

function validateEmailRequest(emailReq) {
    if (!emailReq || typeof emailReq !== 'object') {
        throw new EmailRequestError('Request body must be a JSON object');
    }

    if (!isEmail(emailReq.toEmailAddress)) {
        throw new EmailRequestError('A valid recipient email address is required');
    }

    if (typeof emailReq.subject !== 'string' || !emailReq.subject.trim()) {
        throw new EmailRequestError('A subject is required');
    }

    if (!Array.isArray(emailReq.attachments) || typeof emailReq.attachments[0] !== 'string') {
        throw new EmailRequestError('A PDF attachment is required');
    }

    const pdf = decodePdf(emailReq.attachments[0]);
    if (pdf.length > MAX_PDF_BYTES) {
        throw new EmailRequestError('The PDF attachment is too large');
    }
    if (pdf.subarray(0, 5).toString('ascii') !== '%PDF-') {
        throw new EmailRequestError('The attachment is not a valid PDF');
    }

    return pdf;
}

function createMailOptions(emailReq, senderEmail) {
    const pdf = validateEmailRequest(emailReq);
    const filename = sanitizePdfFilename(emailReq.attachmentFilename);

    return {
        from: `"Log Your Workout" <${senderEmail}>`,
        to: emailReq.toEmailAddress.trim(),
        subject: emailReq.subject.trim(),
        html: typeof emailReq.body === 'string' ? emailReq.body : '',
        attachments: [{
            filename,
            content: pdf,
            contentType: 'application/pdf'
        }]
    };
}

async function sendWorkoutEmail(emailReq, options = {}) {
    validateEmailRequest(emailReq);

    const senderEmail = options.senderEmail || process.env.EMAIL;
    const senderPassword = options.senderPassword || process.env.EMAIL_PASS;

    if (!senderEmail || !senderPassword) {
        throw new Error('Email server credentials are not configured');
    }

    const transporter = options.transporter || nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: senderEmail,
            pass: senderPassword
        }
    });

    return transporter.sendMail(createMailOptions(emailReq, senderEmail));
}

function decodePdf(value) {
    const base64 = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value;
    if (!base64 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
        throw new EmailRequestError('The PDF attachment is not valid base64');
    }
    return Buffer.from(base64, 'base64');
}

function sanitizePdfFilename(value) {
    const filename = typeof value === 'string' ? value.trim() : '';
    const safeName = filename
        .replace(/\.pdf$/i, '')
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 100);

    return `${safeName || 'workout-log'}.pdf`;
}

function isEmail(value) {
    return typeof value === 'string'
        && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

module.exports = {
    createMailOptions,
    EmailRequestError,
    sanitizePdfFilename,
    sendWorkoutEmail,
    validateEmailRequest
};
