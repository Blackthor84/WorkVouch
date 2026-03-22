# Worker vouch onboarding (mobile-first)

## Flow

1. **Intro** — “Who have you worked with that would vouch for you?”
2. **Job** — Company + role (minimal `jobs` row).
3. **Coworkers** — 1–2 contacts (`worker_onboarding_contacts`: name + email and/or phone).
4. **Send invite** — Creates `coworker_invites` + signup links for emails (`POST /api/onboarding/vouch/sendinvite`).
5. **Confirmation** — User can finish when they have a job **and** (≥1 saved contact **or** ≥1 invite sent). Sets `profiles.worker_onboarding_loop_completed_at`.

Employees with `worker_onboarding_loop_completed_at` null are kept on `/onboarding` until they complete (see `VouchOnboardingRouteGate` + `needsWorkerVouchOnboarding`).

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/onboarding/vouch/state` | Step, job, contacts, vouch tier, `canComplete` |
| POST | `/api/onboarding/vouch/job` | Create or update latest job |
| PUT | `/api/onboarding/vouch/contacts` | Replace 1–2 contacts |
| POST | `/api/onboarding/vouch/sendinvite` | Create invites + URLs |
| POST | `/api/onboarding/vouch/done` | Mark loop complete |

## Vouch tiers

Stored on `profiles`: `vouch_count`, `vouch_tier` (0–3), **`vouch_status`** (`no_vouch` | `starter` | `verified` | `trusted`). Recomputed via **`refresh_user_vouch_stats(p_user_id)`** when an invite is **accepted** (`POST /api/invites/claim`) — do **not** manually patch counts from the client; use the RPC (or `vouchProfileFieldsFromCount` only if you own the full write path in an API route with `admin`).

```ts
// App-only shape (API routes: prefer admin.rpc("refresh_user_vouch_stats", { p_user_id }))
import { vouchProfileFieldsFromCount } from "@/lib/onboarding/vouchOnboarding";
const next = vouchProfileFieldsFromCount(current + 1);
// await admin.from("profiles").update(next).eq("id", userId);
```

There is no `users` table for this — use **`profiles`**. In-app notification on accept: `vouch_received` with body `You've been vouched for by {name} 🔥`.

## Reminder cron

`GET /api/cron/worker-onboarding-reminders` with `Authorization: Bearer $CRON_SECRET`.

Schedules rows in `worker_onboarding_reminder_queue` (1h / 24h / 48h from profile `created_at`) on first `GET …/vouch/state` while onboarding is incomplete. Times use `date-fns` `addHours` in `lib/onboarding/workerOnboardingNudges.ts`.

**Skip nudges** if the user has already sent **any** `coworker_invites` as sender (`hasInvite`) — queue row is still marked `sent_at` so it won’t retry.

**Copy** (in-app notification title + message) lives in `ONBOARDING_NUDGE_MESSAGES`; 24h line is generic (“People on WorkVouch…”) to avoid location-based messaging.

## Migration

`supabase/migrations/20260317120000_worker_vouch_onboarding.sql` — tables, columns, `refresh_user_vouch_stats`, backfill for existing employees with activity.
