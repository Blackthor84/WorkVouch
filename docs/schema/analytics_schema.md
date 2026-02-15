# Analytics Schema — Canonical Contract

**Purpose:** Single source of truth for internal analytics table and column names. All code must use these names. No guessing. Fail-closed.

---

## Tables (authoritative)

### 1. `site_sessions`

One row per browser session. Session identified by `session_token` (HttpOnly cookie). IP stored as `ip_hash` only (no raw IP; GDPR/CCPA).

| Column (canonical)   | Type      | Required | Description |
|---------------------|-----------|----------|-------------|
| `id`                | UUID      | yes      | Primary key. |
| `session_token`     | TEXT      | yes      | Unique. From cookie `wv_sid`. |
| `user_id`           | UUID      | no       | Set when authenticated. |
| `user_role`         | TEXT      | no       | From profiles.role. |
| `ip_hash`           | TEXT      | no       | SHA-256 hash of IP + salt. |
| `user_agent`        | TEXT      | no       | Truncated. |
| `device_type`       | TEXT      | no       | |
| `os`                | TEXT      | no       | |
| `browser`           | TEXT      | no       | |
| `country`           | TEXT      | no       | From geo headers. |
| `region`            | TEXT      | no       | |
| `city`              | TEXT      | no       | |
| `timezone`          | TEXT      | no       | |
| `is_authenticated`  | BOOLEAN   | yes      | Default false. |
| `is_sandbox`        | BOOLEAN   | yes      | Default false. Sandbox/prod separation. |
| `started_at`        | TIMESTAMPTZ | yes    | Default NOW(). |
| `last_seen_at`      | TIMESTAMPTZ | yes    | Default NOW(). |

**Indexes:** `session_token` (unique), `user_id`, `last_seen_at`, `is_sandbox`, `ip_hash`, `started_at`.

**RLS:** Service role only (USING (false) for anon/authenticated). Inserts/reads via capture API and admin analytics only.

---

### 2. `site_page_views`

One row per page view. FK to `site_sessions(id)`. **path and session_id are required for inserts; DB CHECK enforces non-empty path.**

| Column (canonical) | Type      | Required | Description |
|--------------------|-----------|----------|-------------|
| `id`               | UUID      | yes      | Primary key. |
| `session_id`       | UUID      | no*      | FK site_sessions(id). *Application MUST set when available; nullable only for legacy. |
| `user_id`          | UUID      | no       | Denormalized from session when known. |
| `path`             | TEXT      | **yes**  | Page path. **Must be non-empty.** CHECK in DB. |
| `referrer`         | TEXT      | no       | |
| `duration_ms`      | INTEGER   | no       | |
| `is_sandbox`       | BOOLEAN   | yes      | Default false. |
| `created_at`       | TIMESTAMPTZ | yes    | Default NOW(). |

**Guards:** Insert MUST fail if `path` is null or empty (DB constraint + app validation).

---

### 3. `site_events`

Discrete events (clicks, form submits, errors). FK to `site_sessions(id)`. **event_type required; DB CHECK enforces non-empty.**

| Column (canonical) | Type      | Required | Description |
|--------------------|-----------|----------|-------------|
| `id`               | UUID      | yes      | Primary key. |
| `session_id`       | UUID      | no       | FK site_sessions(id). May be null if no session cookie. |
| `user_id`          | UUID      | no       | |
| `event_type`       | TEXT      | **yes**  | **Must be non-empty.** CHECK in DB. |
| `event_metadata`   | JSONB     | no       | No PII. |
| `is_sandbox`       | BOOLEAN   | yes      | Default false. |
| `created_at`       | TIMESTAMPTZ | yes    | Default NOW(). |

**Guards:** Insert MUST fail if `event_type` is null or empty (DB constraint + app returns 400 if missing).

---

### 4. `abuse_signals`

Security/abuse detection. No PII in metadata.

| Column (canonical) | Type      | Required | Description |
|--------------------|-----------|----------|-------------|
| `id`               | UUID      | yes      | Primary key. |
| `session_id`       | UUID      | no       | |
| `signal_type`      | TEXT      | yes      | |
| `severity`         | INTEGER   | yes      | Default 1. |
| `metadata`         | JSONB     | no       | No PII. |
| `is_sandbox`       | BOOLEAN   | yes      | Default false. |
| `created_at`       | TIMESTAMPTZ | yes    | Default NOW(). |

**RLS:** Service role only.

---

## Legacy / alternate tables (do not use for new code)

- **site_visits** (TEXT `session_id`): Legacy page views. Prefer `site_sessions` + `site_page_views`.
- **site_events_legacy**: Renamed if enterprise `site_events` (UUID session_id) was created after.

---

## Insert contract

1. **Page views (capture API):** Must supply `path` (non-empty). `session_id` must be set when session exists (create session first).
2. **Events (event API):** Must supply `event_type` (non-empty). Return 400 if missing. `session_id` optional.
3. All inserts use service role. No direct client writes.
4. DNT:1 → do not persist (capture returns 200 without writing).

---

## Idempotent migrations

Analytics migrations use `IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, and `DROP POLICY IF EXISTS` / `CREATE POLICY` so re-runs are safe.
