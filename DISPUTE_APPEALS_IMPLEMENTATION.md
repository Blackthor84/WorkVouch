# Dispute & Appeals System – Implementation Summary

Production-grade dispute and appeal flow for WorkVouch: submission, evidence, admin review, appeals, audit logs, and trust score hooks.

## 1. Database (Supabase / Postgres)

### Migrations (run in order)

1. **`supabase/migrations/20250129000004_disputes_appeals.sql`**
   - Enums: `dispute_type_enum`, `dispute_status_enum`, `appeal_status_enum`, `dispute_action_type_enum`
   - Tables: `disputes`, `dispute_evidence`, `appeals`, `dispute_actions`, `audit_logs`
   - `profiles`: `active_dispute_count`, `trust_score_under_review`
   - RLS on all new tables; unique index for one open dispute per `(related_record_id, dispute_type)`

2. **`supabase/migrations/20250129000005_dispute_storage.sql`**
   - Private bucket `dispute-evidence` (10MB, PDF/images)
   - Storage RLS: users upload/read under `{user_id}/`; admins read all

### Tables

| Table | Purpose |
|-------|--------|
| `disputes` | User-initiated; `dispute_type`, `related_record_id`, `status`, `resolution_summary`, `resolved_by`, `resolved_at` |
| `dispute_evidence` | Evidence rows; `file_url` = storage path; register after upload |
| `appeals` | One per dispute; only when dispute is resolved/rejected |
| `dispute_actions` | Admin action log per dispute |
| `audit_logs` | Immutable; entity_type, entity_id, old_value, new_value, change_reason |

### RLS (summary)

- **disputes**: User sees own; admin sees all; only admin can UPDATE (status/resolution).
- **dispute_evidence**: User sees/inserts for own disputes; admin sees all.
- **appeals**: User sees own, inserts for own dispute; admin full access.
- **dispute_actions**: User sees for own disputes; admin full access.
- **audit_logs**: Admin SELECT only; inserts via service role in API.

## 2. Storage

- **Bucket**: `dispute-evidence` (private).
- **Path**: `{user_id}/{dispute_id}/{filename}`.
- **Allowed**: PDF, JPEG, PNG, WebP; 10MB.
- **Access**: Signed URLs only (user route for own evidence; admin route for any evidence).

## 3. API Routes

### User

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/user/dispute-status` | Open disputes, trust score, `underReview` |
| POST | `/api/user/disputes` | Submit dispute (Zod; rate limit 3 open, 30-day cooldown per record) |
| POST | `/api/user/appeals` | Submit appeal (one per dispute; dispute must be resolved/rejected) |
| POST | `/api/user/dispute-evidence` | Register evidence after upload (body: `dispute_id`, `file_path`, `file_type`) |
| GET | `/api/user/dispute-evidence/[id]/signed-url` | Signed URL to view own evidence |

### Admin

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/dispute` | List disputes (optional `status`, `dispute_type`) |
| PATCH | `/api/admin/dispute/[id]` | Update status, resolution; optional `action_type`/`action_notes`; logs to `dispute_actions` and `audit_logs`; triggers trust recalc and transparency refresh on resolve/reject |
| POST | `/api/admin/appeal/[id]/review` | Review appeal (body: `status`: approved/denied, `notes`) |
| GET | `/api/admin/dispute-evidence/[id]/signed-url` | Signed URL for any evidence (admin only) |

Note: `/api/admin/disputes` is the existing employer-disputes list; user-initiated disputes are under `/api/admin/dispute` (singular).

## 4. Trust Score & Transparency

- **`lib/dispute-audit.ts`**
  - `logAudit()` – write to `audit_logs`.
  - `onDisputeResolvedAffectsTrust()` – calls `recalculateTrustScore(userId)` when dispute type is employment, reference, fraud_flag, or trust_score.
  - `refreshUserDisputeTransparency()` – updates `profiles.active_dispute_count` and `profiles.trust_score_under_review` (true when user has open/under_review dispute on trust_score or fraud_flag).

- **When to run**
  - After PATCH resolve/reject on a dispute (admin dispute route).
  - After appeal review (approve/deny) for transparency; approve also triggers trust recalc when dispute type affects score.

## 5. Security

- All admin routes use `getCurrentUser()` + `isAdmin()`.
- Dispute submission: Zod; max 3 open disputes; 30-day cooldown per `(user, related_record_id, dispute_type)`.
- Evidence: path must start with `{user_id}/{dispute_id}/`; allowed MIME types enforced in API and storage.
- Audit: all admin resolution and appeal actions logged to `audit_logs` and `dispute_actions` where applicable.

## 6. Migration Instructions

1. Apply SQL in order:
   - `supabase/migrations/20250129000004_disputes_appeals.sql`
   - `supabase/migrations/20250129000005_dispute_storage.sql`
2. If using Supabase CLI: `supabase db push` or run the two migration files in the SQL Editor.
3. Ensure `user_roles` exists and has admin/superadmin roles for RLS.
4. Env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` for API and signed URLs.

## 7. Evidence Upload Flow (client)

1. User uploads file to Storage bucket `dispute-evidence` with path `{user_id}/{dispute_id}/{unique_filename}` (e.g. via Supabase client with RLS).
2. Client calls `POST /api/user/dispute-evidence` with `{ dispute_id, file_path, file_type }` to register the row in `dispute_evidence`.
3. To display or download: call `GET /api/user/dispute-evidence/[id]/signed-url` (or admin equivalent) and use the returned URL.
