# Log Your Workout Mail Server

Email service for Log Your Workout. It sends generated workout PDFs through
Resend and can run as a local Express server or as a Netlify function.

## Requirements

- Node.js 20.12.2 or newer
- A verified domain in Resend
- A Resend API key with sending access

## Configuration

Create `.env` from `.env.example`:

```env
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=noreply@logyourworkout.app
```

Configure `RESEND_API_KEY` in Netlify for production. The sender defaults to
`noreply@logyourworkout.app`; set `FROM_EMAIL` only if you need to override it.
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

### Production environment

In the Netlify site that deploys this repository:

1. Open **Project configuration > Environment variables**.
2. Add `RESEND_API_KEY` with the API key from Resend.
3. Add `FROM_EMAIL` with `noreply@logyourworkout.app`.
4. Select **Deploys > Trigger deploy > Deploy site**.

The API key belongs only in this mail-server site. Do not put it in the Angular
application or any `environment.ts` file because browser users could read it.

## Troubleshooting

- `400 Invalid email request`: inspect the recipient and PDF payload.
- `500 Email server is not configured`: verify `RESEND_API_KEY`.
- `502 Email provider rejected the message`: inspect the Netlify function logs
  and the Resend email logs. Confirm that `logyourworkout.app` is verified in
  Resend and that `FROM_EMAIL` uses that domain.

The maximum decoded PDF size is 4 MB so the base64 JSON request remains within
Netlify's synchronous function request limit.
