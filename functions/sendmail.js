require('dotenv').config({ quiet: true });
const { EmailRequestError, sendWorkoutEmail } = require('./mail');

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: corsHeaders,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const emailReq = JSON.parse(event.body || '{}');
        const info = await sendWorkoutEmail(emailReq);
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Email sent',
                messageId: info.messageId
            })
        };
    } catch (error) {
        console.error('Unable to send workout email:', error);
        const configurationError = error.message === 'Email server credentials are not configured';
        const requestError = error instanceof EmailRequestError || error instanceof SyntaxError;
        return {
            statusCode: requestError ? 400 : configurationError ? 500 : 502,
            headers: corsHeaders,
            body: JSON.stringify({
                error: requestError
                    ? 'Invalid email request'
                    : configurationError
                        ? 'Email server is not configured'
                        : 'Email provider rejected the message'
            })
        };
    }
};
