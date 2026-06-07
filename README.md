# Log Your Workout Mail Server

Email service for Log Your Workout. It sends generated workout PDFs through
Gmail and can run as a local Express server or as a Netlify function.

## Requirements

- Node.js 20.12.2 or newer
- A Google account with two-step verification
- A Google app password

## Configuration

Create `.env` from `.env.example`:

```env
EMAIL=your-google-account@example.com
EMAIL_PASS=your-google-app-password
```

Use the Google app password without spaces. The regular account password will
not work.

Configure the same `EMAIL` and `EMAIL_PASS` variables in Netlify for production.
Never commit `.env` or real credentials.

## Development

```powershell
npm install
npm test
npm start
```

The local server listens on `http://localhost:3000`. The Angular development
environment posts PDF email requests to `http://localhost:3000/sendmail`.

Available endpoints:

- `GET /health`
- `POST /sendmail`

## Netlify

Verify the function bundle locally:

```powershell
npx netlify functions:build --src functions
```

The generated ZIP files and manifest are build artifacts and are ignored by
Git. Netlify deploys `functions/sendmail.js` at:

```text
/.netlify/functions/sendmail
```

The `/sendmail` redirect is configured in `netlify.toml`.

## Troubleshooting

- `534 5.7.9 WebLoginRequired`: replace `EMAIL_PASS` with a current Google app
  password locally and in Netlify, then redeploy.
- `400 Invalid email request`: inspect the recipient and PDF payload.
- `500 Email server is not configured`: verify `EMAIL` and `EMAIL_PASS`.
- `502 Email provider rejected the message`: inspect the Netlify function logs
  and the sending Google account.

The maximum decoded PDF size is 4 MB so the base64 JSON request remains within
Netlify's synchronous function request limit.
