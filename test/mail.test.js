const assert = require('node:assert/strict');
const test = require('node:test');

const {
    createMailOptions,
    EmailRequestError,
    sanitizePdfFilename,
    sendWorkoutEmail,
    validateEmailRequest
} = require('../lib/mail');

const pdfBase64 = Buffer.from('%PDF-1.4\nworkout').toString('base64');

function createRequest(overrides = {}) {
    return {
        toEmailAddress: 'athlete@example.com',
        subject: 'Sunday workout',
        body: '<p>Attached workout.</p>',
        attachments: [pdfBase64],
        attachmentFilename: 'sunday-workout-2026-06-07.pdf',
        ...overrides
    };
}

test('creates an in-memory PDF attachment with a safe filename', () => {
    const options = createMailOptions(
        createRequest({ attachmentFilename: '../../Sunday workout.pdf' }),
        'sender@example.com'
    );

    assert.equal(options.from, '"Log Your Workout" <sender@example.com>');
    assert.equal(options.to, 'athlete@example.com');
    assert.equal(options.attachments[0].filename, '..-..-Sunday-workout.pdf');
    assert.equal(options.attachments[0].content.toString(), '%PDF-1.4\nworkout');
});

test('rejects invalid recipients and non-PDF attachments', () => {
    assert.throws(
        () => validateEmailRequest(createRequest({ toEmailAddress: 'invalid' })),
        error => error instanceof EmailRequestError && /valid recipient/.test(error.message)
    );
    assert.throws(
        () => validateEmailRequest(createRequest({
            attachments: [Buffer.from('not a pdf').toString('base64')]
        })),
        /valid PDF/
    );
});

test('uses the injected transporter without writing a temporary file', async () => {
    let sentOptions;
    const info = await sendWorkoutEmail(createRequest(), {
        senderEmail: 'sender@example.com',
        transporter: {
            sendMail: async options => {
                sentOptions = options;
                return { messageId: 'test-message-id' };
            }
        }
    });

    assert.equal(info.messageId, 'test-message-id');
    assert.equal(sentOptions.attachments[0].filename, 'sunday-workout-2026-06-07.pdf');
    assert.ok(Buffer.isBuffer(sentOptions.attachments[0].content));
});

test('uses the Log Your Workout noreply address by default', async () => {
    let sentOptions;
    await sendWorkoutEmail(createRequest(), {
        transporter: {
            sendMail: async options => {
                sentOptions = options;
                return { messageId: 'test-message-id' };
            }
        }
    });

    assert.equal(
        sentOptions.from,
        '"Log Your Workout" <noreply@logyourworkout.app>'
    );
});

test('sanitizes missing and unusual attachment filenames', () => {
    assert.equal(sanitizePdfFilename(), 'workout-log.pdf');
    assert.equal(sanitizePdfFilename('Séance / jambes.PDF'), 'S-ance-jambes.pdf');
});
