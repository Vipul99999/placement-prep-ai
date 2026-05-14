# Placement Prep AI

Placement Prep AI is a polished MVP for Tier-2/3 students who want structured company-wise placement preparation instead of random question lists.

## Docs

- [Deployment Guide](C:\Users\vipul\Documents\Codex\2026-04-26-build-project-placement-prep-ai-goal\docs\DEPLOYMENT.md)
- [Operations Guide](C:\Users\vipul\Documents\Codex\2026-04-26-build-project-placement-prep-ai-goal\docs\OPERATIONS.md)

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- MongoDB Atlas with referenced collections
- Gemini API with structured JSON output
- NextAuth credentials auth
- SMTP email delivery for password reset

## Why The MongoDB Design Matters

This MVP avoids storing one giant prep pack document. `prepPacks` stores metadata, analysis, category plan, and roadmap only. Questions live in a reusable `questions` collection, while `prepPackQuestions` acts as the join layer that keeps category order and prep-pack-specific state lightweight.

That gives the app:

- lower duplicate storage
- safer scaling under MongoDB's 16MB document limit
- reusable question bank behavior
- category-wise pagination and faster detail pages
- lazy detailed-answer generation to avoid storing heavy content too early

## Collections

### `prepPacks`

Stores prep metadata, hashed JD reference, analysis, category plan, roadmap, and counters.

### `questions`

Stores the global reusable question bank with unique `fingerprint`, answer fields, tags, and usage metrics.

### `prepPackQuestions`

Stores `prepPackId` to `questionId` links plus per-pack order and practice state.

### `generationJobs`

Tracks category-wise generation and reuse counts for observability.

### `jobDescriptions`

Optional storage for full JDs keyed by hash. `prepPacks` only keeps `jobDescriptionHash` and a preview string.

## API Routes

- `POST /api/analyze`
- `GET /api/prep-packs?page=1&limit=12&search=React&status=completed`
- `POST /api/prep-packs`
- `GET /api/prep-packs/[id]`
- `DELETE /api/prep-packs/[id]`
- `GET /api/prep-packs/[id]/questions?category=React&page=1&limit=20`
- `POST /api/prep-packs/[id]/process`
- `POST /api/prep-packs/[id]/generate-more`
- `POST /api/prep-packs/[id]/generate-category`
- `POST /api/prep-packs/[id]/roadmap`
- `GET /api/prep-packs/[id]/mock-interview?count=5`
- `GET /api/prep-packs/[id]/download`
- `POST /api/questions/[id]/generate-detailed-answer`
- `PATCH /api/prep-packs/[id]/question-state/[joinId]`
- `GET /api/dashboard/analytics`
- `POST /api/uploads/resume`
- `GET /api/account/preferences`
- `PATCH /api/account/preferences`
- `GET /api/account/export`
- `DELETE /api/account`
- `POST /api/support`
- `POST /api/feedback`
- `POST /api/jobs/process`
- `POST /api/jobs/retention`
- `GET /api/admin/runtime-health`
- `POST /api/internal/cron`
- `GET /admin`

## Local Setup

1. Install dependencies.
2. Copy `.env.example` to `.env.local`.
3. Fill in `MONGODB_URI`, `MONGODB_DB`, `GEMINI_API_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, SMTP settings, `ADMIN_EMAILS`, and the daily AI budget envs if you want non-default limits.
4. Run `npm run dev`.
5. Run `npm run test:unit`, `npm run test:api`, and `npm run test:e2e` for verification.

## Generation Flow

1. The create page submits a prep-pack request.
2. Gemini analyzes the input into structured JSON.
3. The app stores only prep-pack metadata and analysis in `prepPacks`.
4. For each category, the app reuses matching questions from `questions`.
5. Gemini generates only the missing unique questions.
6. `prepPackQuestions` links all selected questions to the prep pack.
7. The prep page loads category summaries first and fetches paginated questions on demand.

## Queue Architecture

- Prep pack creation now stores metadata first and enqueues category generation jobs.
- Category jobs live in `generationJobs` with `pending`, `running`, `completed`, and `failed` states.
- Users can advance queued work from the prep page.
- Admins or automations can process queued jobs through `POST /api/jobs/process`.
- A long-running worker is now available through `npm run worker` for continuous job execution and retention cleanup.
- External schedulers can hit `POST /api/internal/cron` with `x-cron-secret: <CRON_SECRET>` for hosted cron execution.

## Runtime Health

- `npm run health:runtime` checks MongoDB, Gemini, SMTP, and monitoring webhooks with your real env values.
- Admins can call `GET /api/admin/runtime-health` for the same live status from inside the app.
- I could not connect actual production secrets from here, so this code is ready for live verification once real env values are present.

## Trust And Safety

- Mutating API routes now enforce same-origin checks and JSON content-type validation where appropriate.
- AI input is sanitized before prompting, and unsafe or off-purpose generated output is filtered before storage.
- Question quality is bounded over time, duplicate generation jobs are deduplicated, and cached views are invalidated more consistently after writes.
- `/create` is intentionally explorable without hard middleware redirect, but actual generation still requires authenticated and verified API access.
- Daily AI budgets protect against runaway Gemini usage by limiting prep-pack creation, question generation, and detailed-answer expansion per user.

## Privacy Controls

- Users can export their account data as JSON from the account page.
- Users can delete individual prep packs.
- Users can delete their account and personal workspace data.

## Product Readiness Extras

- Dashboard onboarding helps first-time users reach the highest-value setup milestones quickly.
- Account preferences save default prep duration, difficulty, and communication preferences.
- A help center gives public FAQ access, while signed-in users can send support tickets directly in-app.
- Feedback collection is built into the product so roadmap decisions can follow real user friction and delight signals.
- Prep-pack list reads now support server-side pagination and filtering for better scale as user history grows.

## Testing

- Unit checks cover hashing, validators, and AI-safety sanitization.
- API checks cover invalid input and protected cron behavior.
- Playwright E2E covers signup verification, forgot/reset password, create flow, resend verification, and failure paths.

## Notes

- The export flow now generates a real PDF on the client from structured prep-pack data fetched from the app API.
- Password reset now uses real SMTP delivery instead of exposing reset links in the UI.
- Resume uploads support PDF, DOCX, and text files, and project highlights are reused for project-based interview prep.
- Question review state now supports spaced reminders and streak-style revision tracking.
- Admin users listed in `ADMIN_EMAILS` get an `/admin` observability surface for audit logs and generation jobs.
- Query-plan snapshots in the admin area help review Mongo execution behavior with real data volume.
- Login, signup, bookmarks, notes, practice status, and dashboard/prep analytics are now part of the app flow.
- Fallback analysis and roadmap generators are included so the app still behaves gracefully if Gemini is temporarily unavailable.
- Index creation is handled automatically on first DB access.
