# Deployment Guide

## Required Environment Variables

- `MONGODB_URI`
- `MONGODB_DB`
- `GEMINI_API_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `ADMIN_EMAILS`
- `CRON_SECRET`
- `MONITORING_WEBHOOK_URL` optional
- `ALERT_WEBHOOK_URL` optional

## Recommended Production Setup

1. Run `npm run build`.
2. Run `npm run start` for the web app.
3. Run `npm run worker` as a separate long-running process.
4. Configure a hosted cron job to call `POST /api/internal/cron` with header `x-cron-secret: <CRON_SECRET>`.
5. Run `npm run health:runtime` once after deployment to verify MongoDB, Gemini, SMTP, and monitoring connectivity.

## Runtime Roles

- Web app:
  Handles pages, APIs, auth, user actions.

- Worker:
  Continuously processes queued generation jobs and periodic retention cleanup.

- Cron:
  Provides backup processing and health checks in hosted environments.

## Recommended Checks After Deploy

1. Sign up a fresh user and verify email delivery.
2. Create a prep pack and confirm generation jobs move from `pending` to `completed`.
3. Upload a resume and verify extraction works.
4. Test password reset email.
5. Open `/admin` and verify runtime health plus alerts.
