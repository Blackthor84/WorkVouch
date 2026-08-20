# Security

## Access control

- Upload, parse, confirm, delete: authenticated user only
- Parse/confirm: path must belong to requesting user
- Impersonation: writes blocked via `rejectWriteIfImpersonating`

## Storage

- Private `resumes` bucket
- Signed URLs via `GET /api/resume/me` (1 hour)
- No public resume URLs in API responses

## Logging

Do **not** log:

- Resume full text
- Street addresses
- OpenAI API keys

Audit logs store metadata only (path, counts, parse status).

## AI transmission

Resume text sent to OpenAI for parsing only; not stored server-side after request.

## Legacy route

`POST /api/resume-upload` disabled (410) — was unauthenticated.

## Data retention

Resume file lifecycle: upload → optional delete. Employment records follow standard retention; verified records survive resume deletion.
