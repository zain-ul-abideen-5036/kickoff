# Deploying Kickoff

Kickoff runs entirely on free tiers: **Vercel Hobby** for the app, **Vercel Blob** for storage,
**Gemini's free tier** for wording (optional) and **Resend's free plan** for email (optional). One
deployment serves one studio.

## What you need

| Service                                                                    | Why                                                          | Required                          |
| -------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------- |
| Vercel account                                                             | Hosts the app                                                | Yes                               |
| Vercel Blob store                                                          | Saves briefs, settings, drafts and the logo (private access) | Yes                               |
| Gemini API key ([aistudio.google.com](https://aistudio.google.com/apikey)) | Writes the summary, audience profiles and follow-up wording  | No: templates are used without it |
| Resend API key ([resend.com](https://resend.com))                          | Emails the brief to clients and notifies the studio          | No: copy the share link instead   |

## Steps

1. **Import the repository** in Vercel (Add New → Project). The defaults are right: framework
   Next.js, build command `next build`. `vercel.json` pins the London region.
2. **Create a Blob store** under Storage → Create → Blob, and choose **private** access. Connect it to
   the project. This adds `BLOB_READ_WRITE_TOKEN` for you.
3. **Add environment variables** (Settings → Environment Variables, Production):

   | Variable         | Value                                                                                             |
   | ---------------- | ------------------------------------------------------------------------------------------------- |
   | `SESSION_SECRET` | 32+ random characters, e.g. `openssl rand -base64 48`                                             |
   | `SETUP_CODE`     | Any phrase you'll type once on `/setup`                                                           |
   | `APP_URL`        | Your public URL, e.g. `https://kickoff-studio.vercel.app`                                         |
   | `GEMINI_API_KEY` | Optional                                                                                          |
   | `GEMINI_MODEL`   | Optional, defaults to `gemini-2.5-flash`                                                          |
   | `RESEND_API_KEY` | Optional                                                                                          |
   | `EMAIL_FROM`     | Optional, a sender on a domain verified in Resend, e.g. `Studio North <briefs@studionorth.co.uk>` |

4. **Deploy**, then open `/setup`. Enter your studio name, your email, a password and the setup code.
   This creates the single owner account and signs you in.
5. **Make it yours** in Settings: logo, brand colour, rate card, timeline defaults and which intake
   steps clients see.
6. **Share your intake link**, `https://<your-app>/start`. New briefs appear on the dashboard.

To see the dashboard with data straight away, use **Load sample briefs** on the empty dashboard.
From your machine you can also run `BLOB_READ_WRITE_TOKEN=... npm run seed`.

## From the command line

```bash
npx vercel link
npx vercel blob create-store kickoff-briefs   # choose private access, then connect it to the project
printf '%s' "$(openssl rand -base64 48)" | npx vercel env add SESSION_SECRET production
printf '%s' 'your-setup-phrase' | npx vercel env add SETUP_CODE production
printf '%s' 'https://your-app.vercel.app' | npx vercel env add APP_URL production
npx vercel deploy --prod
```

## Checking it worked

- The server log prints `[kickoff]` lines at start-up for anything missing. Errors (no secret, no
  Blob token) mean the deployment isn't safe to use yet; notes (no Gemini, no Resend) only switch
  those features off.
- `/robots.txt` should only allow the home page.
- Response headers include `Content-Security-Policy` and `Strict-Transport-Security`.

## Privacy and data

- Blob storage is private: briefs, drafts and settings are never publicly readable. The logo is
  served through `/api/logo`.
- Share links use 256-bit random tokens, stored only as hashes, and expire after the number of days
  set in Settings (30 by default).
- With AI on, only the client's answers are sent to Gemini, only to write that brief. Prices,
  timelines, page counts, the platform choice and risks never come from AI. Any AI text containing
  a figure that doesn't match the calculated plan is discarded for the template.

## Updating

Push to `main`. Vercel redeploys automatically. Settings and briefs live in Blob storage, so they
survive deployments.
