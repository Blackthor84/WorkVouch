# 09 — Resume Parsing Audit

**Date:** 2026-08-13

---

## Executive Answer

**Does WorkVouch parse uploaded resumes?**  
**YES** — two parsing tracks exist with different extraction depth.

---

## Consumer Parsing

| Component | Path |
|-----------|------|
| API | `POST /api/resume/parse` |
| Library | `lib/resume/parseAndStore.ts` |
| Text extraction | `pdf-parse`, `mammoth` |
| AI | OpenAI `gpt-4o-mini` (JSON mode) |

### Fields extracted (consumer)

| Field | Extracted |
|-------|-----------|
| `company_name` | ✅ |
| `job_title` | ✅ |
| `start_date` | ✅ |
| `end_date` | ✅ |
| `is_current` | ✅ |
| `company_normalized` | ✅ |
| Name | ❌ |
| Email | ❌ |
| Phone | ❌ |
| Address | ❌ |
| Skills | ❌ |
| Education | ❌ |

### Behavior

- Raw resume text sent to OpenAI in-memory
- Parse route comment: does **not** store raw resume text in DB
- Rate limit: 3 parses/user/day via `audit_logs`
- Confidence scoring: **NOT IMPLEMENTED** (no per-field confidence)

### Error handling

- Invalid file type → 400
- Parse failure → error response to client
- OpenAI failure → caught and returned

---

## Enterprise Workforce Parsing

| Component | Path |
|-----------|------|
| Text extract | `lib/workforce/resume-extract.ts` |
| AI parse | `lib/workforce/resume-parse-ai.ts` |
| Types | `lib/workforce/resume-types.ts` |

### Fields extracted (enterprise)

| Field | Extracted |
|-------|-----------|
| `full_name` | ✅ |
| `email` | ✅ |
| `phone` | ✅ |
| `job_history[]` (company, title, dates) | ✅ |
| `job_history[].location` | ✅ (optional free text) |
| `skills[]` | ✅ |
| `certifications[]` | ✅ |

Stored in: `workforce_resumes.parsed_json` (JSONB)

Downstream: `peer_match_suggestions` via overlap detection

---

## Removed / Stub

- `lib/utils/resume-parser.ts` — removed stub
- `app/api/resume-upload-openai/route.ts` — removed stub

---

## Classification

| Track | Parsing | Production ready |
|-------|---------|------------------|
| Consumer | Employment only | **PARTIAL** — depends on import confirm flow |
| Enterprise | Full structured JSON | **PARTIAL** — API only, no UI |

---

## NOT CURRENTLY IMPLEMENTED (Consumer)

- Name extraction to profile
- Skills/education on consumer profile
- Confidence scores per extracted field
- On-device parsing (all server-side)
- Resume parsing for Greenhouse Connect (no integration path)
