# Log Your Workout Mail Server

Sends workout-log PDFs for the Angular app through Gmail and runs as either a
local Express server or a Netlify function.

## Configure Gmail

1. Enable two-step verification on the Google account used to send mail.
2. Create a Google app password for this server.
3. Copy `.env.example` to `.env`.
4. Set `EMAIL` to the Google account and `EMAIL_PASS` to the 16-character app
   password. Do not use the account's normal password.

For Netlify, configure the same `EMAIL` and `EMAIL_PASS` environment variables
for the production deploy context.

## Test Locally

From this directory:

```powershell
npm install
npm test
npm start
```

The Angular development environment already targets `http://localhost:3000`.
Run the Angular app with `npm start`, create or open a workout log, select
`Email as PDF`, and send it to an address you can inspect.

Verify:

- The UI reports that the email was sent.
- The received message has a readable PDF with the expected workout.
- The attachment has a sanitized workout-based filename.
- The server returns `400` for an invalid recipient or non-PDF payload.
- The generated PDF remains under 4 MB so its base64 JSON payload fits the
  Netlify synchronous function request limit.

## Test A Deployment

Build the function before deploying:

```powershell
npx netlify functions:build --src functions
```

After deploying the mail server and Angular app:

1. Confirm `GET https://<mail-site>/.netlify/functions/sendmail` returns `405`.
2. In the deployed Angular app, email a simple log and an imported workout to
   an address you control.
3. Test both English and French so the subject/body and PDF labels are covered.
4. Inspect the browser Network tab. `POST .../sendmail` should return `200`;
   its preflight should return `204` with an `Access-Control-Allow-Origin`
   header.
5. Confirm both received PDFs open and contain the correct date, exercises,
   units, completion state, and imported program week/day.
6. Check the Netlify function logs if the response is `500` or `502`.

Google error `534 5.7.9 WebLoginRequired` means the configured credential must
be replaced with a current Google app password in both local `.env` and
Netlify's environment variables.
