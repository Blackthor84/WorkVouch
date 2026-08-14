# 12 — Resume Security Audit

**Date:** 2026-08-13

---

## File Storage

| Question | Consumer | Enterprise |
|----------|----------|------------|
| Where stored? | Supabase `resumes` bucket | Supabase storage (workforce route) |
| Public URLs? | ❌ Private bucket | ⚠️ Route uses `getPublicUrl()` — verify bucket policy |
| Signed URLs? | ✅ 1h (self), 60s (employer) | **UNKNOWN** |
| App-level encryption? | ❌ Relies on Supabase at-rest | ❌ |
| Virus scan? | ❌ NOT IMPLEMENTED | ❌ |

---

## Access Control

| Actor | Access |
|-------|--------|
| Owner | Upload, view via signed URL |
| Employer | View via `/api/resume/view` — requires paid subscription + authorization |
| Admin | Service role only (API routes) |
| Anonymous | ❌ Blocked |

---

## Parsed Data

| Question | Status |
|----------|--------|
| Raw text retained in DB? | ❌ Consumer parse — in-memory only |
| Enterprise parsed JSON retained? | ✅ `workforce_resumes.parsed_json` |
| PII in logs? | Parse routes avoid logging raw text; audit via `audit_logs` for rate limit |
| AI provider receives resume? | ✅ OpenAI — consumer + enterprise |
| OpenAI data handling | Subject to OpenAI enterprise/DPA configuration — **not audited in code** |

---

## Deletion

| Action | Status |
|--------|--------|
| User delete resume API | ❌ NOT IMPLEMENTED |
| Replace file (upsert) | ✅ Overwrites storage object |
| Clear parsed JSON on delete | N/A — no delete flow |
| GDPR export includes resume? | **UNKNOWN** — not verified in this audit |

---

## Address / PII in Parsed Content

| Data | Consumer | Enterprise | Recommendation |
|------|----------|------------|----------------|
| Street address | Not extracted | Not extracted | **Exclude** |
| City in job location | Not extracted | Optional free text in JSON | **Do not store** in profile; avoid mapping to heat map |
| State/country | Not extracted | Not extracted | Use `user_locations` country/state only if user opts in |
| Email/phone | Not extracted (consumer) | Stored in `parsed_json` | Encrypt at rest; limit employer visibility |

See verification boundary audit — resume claims ≠ verified data.

---

## Security Findings Summary

| Finding | Severity |
|---------|----------|
| No virus/malware scanning on upload | MEDIUM |
| No delete API | MEDIUM |
| Experimental `/api/resume-upload` (no auth) | HIGH if deployed publicly |
| Import UI/API field mismatch | MEDIUM (UX/security: user confusion) |
| Enterprise `getPublicUrl()` | MEDIUM — verify bucket is private |
| OpenAI sends full resume text | MEDIUM — document in privacy policy |
| Workforce `parsed_json` retains PII | MEDIUM — access control on enterprise routes |

---

## Employer Access Authorization

`/api/resume/view` gates employer access on subscription + relationship — **implemented**. Resume file itself is not shown in Greenhouse panel (trust/verification summary only).

---

## Greenhouse Exclusion

Resume files and raw parsed text are **not sent to Greenhouse** in current Connect MVP. Panel shows WorkVouch trust/verification aggregates only.
