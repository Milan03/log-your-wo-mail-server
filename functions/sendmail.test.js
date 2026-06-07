const assert = require('node:assert/strict');
const test = require('node:test');

const { handler } = require('./sendmail');

test('returns CORS headers for preflight requests', async () => {
    const response = await handler({ httpMethod: 'OPTIONS' });

    assert.equal(response.statusCode, 204);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
    assert.equal(response.headers['Access-Control-Allow-Methods'], 'POST, OPTIONS');
});

test('returns a controlled client error for an invalid request', async context => {
    context.mock.method(console, 'error', () => {});

    const response = await handler({
        httpMethod: 'POST',
        body: JSON.stringify({})
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
    assert.deepEqual(JSON.parse(response.body), { error: 'Invalid email request' });
});

test('returns a controlled client error for malformed JSON', async context => {
    context.mock.method(console, 'error', () => {});

    const response = await handler({
        httpMethod: 'POST',
        body: '{'
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
    assert.deepEqual(JSON.parse(response.body), { error: 'Invalid email request' });
});
