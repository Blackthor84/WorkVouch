# Resume Import System – Setup & Reference

Production-grade resume import: upload → parse → review → confirm. No unreviewed data is inserted.

## 1. Supabase storage bucket

Run the migration so the `resumes` bucket exists:

- **Apply migration:** `supabase/migrations/20250129100000_resumes_bucket.sql`
- Or run in Supabase SQL Editor:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  5242880,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
```

- **Bucket behavior:** private, max 5MB, PDF and DOCX only. Access only via API (service role). No direct client access; signed URLs only if you add a separate endpoint later.

## 2. Environment variables

Add to `.env.local` (and to Vercel / your host):

```bash
OPENAI_API_KEY=sk-...
```

- Required for `/api/resume/parse` (structured employment extraction).
- Never expose this key to the client; it is used only in API routes.

## 3. Required npm packages

Already in `package.json`:

- `pdf-parse` – PDF text extraction
- `mammoth` – DOCX text extraction
- `openai` – structured employment extraction
- `zod` – request validation in confirm route

Install if needed: `npm install pdf-parse mammoth openai zod`

## 4. API routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/resume/upload` | POST | Required | Validate file (PDF/DOCX, ≤5MB), upload to `resumes` bucket, return `{ path }` |
| `/api/resume/parse` | POST | Required | Body: `{ path }`. Fetch file (service role), extract text (pdf-parse / mammoth), call OpenAI, normalize, return `{ employment }`. Rate limit: 3 attempts per user per day. |
| `/api/resume/confirm` | POST | Required | Body: `{ employment }`. Validate with Zod, insert into `employment_records` (verification_status = `"pending"`), call `POST /api/match-employment` per record, log to `audit_logs`. |

- All use NextAuth session; service role is used only server-side for storage and DB.
- Parsing errors return: `{ error: "Could not extract structured employment data. Please add manually." }` (no stack trace to client).

## 5. Review UI

- **Page:** `/dashboard/import-resume`
- **Flow:**  
  1. Upload resume (Step 1).  
  2. Parse → show parsed employment in editable form (Step 2).  
  3. User edits, then clicks **Confirm and save** → calls `/api/resume/confirm`; nothing is written until confirm.

- **Components:**  
  - `app/(app)/dashboard/import-resume/page.tsx` – server page (dashboard layout already enforces auth).  
  - `app/(app)/dashboard/import-resume/ImportResumeClient.tsx` – client: upload, parsed table, edit, confirm, success state.

- **State:** Controlled form state for employment rows; no auto-insert of parsed data.

## 6. Zod schemas (confirm route)

`app/api/resume/confirm/route.ts`:

- `employmentItemSchema`: `company_name`, `job_title`, `start_date` (YYYY-MM-DD), `end_date` (nullable), `is_current`.
- `confirmBodySchema`: `employment` array (1–100 items).

## 7. Security

- Only authenticated users can upload, parse, or confirm.
- Service role used only in API routes (Supabase admin); never exposed to client.
- OpenAI key used only server-side.
- Raw resume text is not stored in the database.
- Resume files live in a private bucket; access only via backend.

## 8. Optional: parsing rate limit

- Implemented in `/api/resume/parse`: 3 attempts per user per day (counted via `audit_logs` with `entity_type = 'resume_parse'`).
- Each parse attempt is logged in `audit_logs` (path and employment count).

## 9. Audit logs

- **Parse:** `entity_type: 'resume_parse'`, `entity_id`: user id, `new_value`: `{ path, employment_count }`, `change_reason: 'resume_parse'`.
- **Confirm:** `entity_type: 'resume_import'`, `entity_id`: user id, `new_value`: `{ employment_count, record_ids }`, `change_reason: 'resume_import_confirmed'`.

Insert is done with service role (no RLS policy for insert on `audit_logs`).

## 10. Linking from dashboard

To add a shortcut from the main dashboard (e.g. “Import resume”):

- Use path: `/dashboard/import-resume`
- Example: in `app/(app)/dashboard/page.tsx`, add a shortcut with `href: "/dashboard/import-resume"` and label “Import resume”.
