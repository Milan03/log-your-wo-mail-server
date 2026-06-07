require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const { EmailRequestError, sendWorkoutEmail } = require('../lib/mail');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: true,
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '6mb' }));

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.post('/sendmail', async (req, res) => {
    try {
        const info = await sendWorkoutEmail(req.body);
        res.json({
            message: 'Email sent',
            messageId: info.messageId
        });
    } catch (error) {
        console.error('Unable to send workout email:', error);
        const configurationError = error.message === 'Email server credentials are not configured';
        const requestError = error instanceof EmailRequestError;
        res.status(requestError ? 400 : configurationError ? 500 : 502).json({
            error: requestError
                ? 'Invalid email request'
                : configurationError
                    ? 'Email server is not configured'
                    : 'Email provider rejected the message'
        });
    }
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

module.exports = app;
