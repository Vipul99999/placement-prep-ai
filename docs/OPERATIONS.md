# Operations Guide

## Daily Admin Checks

1. Review `/admin` for open alerts.
2. Check failed generation jobs.
3. Review runtime health status.
4. Watch due review counts and queue growth.

## Queue Processing

- Manual:
  `POST /api/jobs/process`

- Continuous:
  `npm run worker`

- Hosted backup:
  `POST /api/internal/cron`

## Retention

- Manual cleanup:
  `POST /api/jobs/retention`

- Config:
  - `RETENTION_UPLOAD_DAYS`
  - `RETENTION_AUDIT_DAYS`
  - `RETENTION_JOB_DAYS`

## Health Checks

- CLI:
  `npm run health:runtime`

- Admin API:
  `GET /api/admin/runtime-health`

## Incident Hints

- If Gemini calls fail:
  Check `GEMINI_API_KEY`, quota, and runtime health output.

- If emails fail:
  Check SMTP config and `SMTP_FROM`.

- If queue stalls:
  Confirm worker process is alive and cron secret is configured.

- If abuse spikes:
  Review rate-limit alerts and audit logs in `/admin`.
