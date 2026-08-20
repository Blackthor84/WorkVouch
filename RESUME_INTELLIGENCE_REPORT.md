# Resume Intelligence Report — Sprint 11

## Executive summary

Sprint 11 repaired the broken resume upload contract, unified parsing around a shared `lib/resume/` layer, and delivered a full review-and-confirm workflow that feeds the **existing** `employment_records` model as **pending** claims — never verified automatically.

## What existed before

- `POST /api/resume/upload` (field `resume`, returned `{ url }`)
- `POST /api/resume/parse` (employment only, inline logic)
- `POST /api/resume/confirm` (pending inserts, no `source: resume`)
- `ImportResumeClient` broken (field `file`, expected `{ path }`)
- Legacy unauthenticated `POST /api/resume-upload`
- No identity extraction, confidence UI, duplicate detection, or delete API
- No resume-specific tests

## What was fixed

| Issue | Fix |
|-------|-----|
| Upload contract mismatch | Canonical `{ path }` + backward-compatible `url`; field `resume` everywhere |
| Path validation | `isResumePathOwnedByUser` for flat `{userId}-*` keys |
| Confirm missing source | Inserts include `source: resume` with fallback |
| Legacy open route | `410 Gone` on `/api/resume-upload` |
| ImportResumeClient | Rewired to canonical contract + combined upload/parse |

## What was built

### Library (`lib/resume/`)

- `types.ts` — canonical contracts
- `path-utils.ts`, `validate-upload.ts`, `extract-text.ts`
- `parse-resume.ts` — identity + employment + confidence
- `duplicate-detection.ts`, `confirm-resume.ts`
- `confidence.ts`, `normalize-dates.ts`

### APIs

- Upload: TXT support, canonical response
- Parse: identity + employment + duplicates + warnings
- Confirm: duplicates, profile opt-in, verification URL
- `DELETE /api/resume` — file removal without touching employment

### UI

- `ImportResumeClient`: personal info + employment review, confidence badges, duplicate resolution, verification CTA

### Tests

- `tests/resume-intelligence.test.ts` — contract, validation, dates, confidence, duplicates, privacy

### Documentation

- `docs/resume-intelligence/` (9 files)

## Resume flow

```
Upload (resume field) → path
  → Parse (identity + employment + confidence)
  → User review / edit / duplicate choice
  → Confirm → pending employment_records (source=resume)
  → Verification modal → verified → Trust
```

## Supported formats

PDF, DOC, DOCX, TXT — max 5 MB

## Extracted fields

**Identity:** name, email, phone, city, state, country (no street/ZIP stored)

**Employment:** company, title, dates, current flag, location, description, type (latter three review-only)

## Confidence model

High (≥85%), Medium (≥60%), Low (<60%) — user-facing labels only

## Employment model

Single table: `employment_records`. Resume records: `verification_status=pending`, `source=resume`.

## Verification boundary

Resume → claim → user confirm → pending → **existing verification engine** → verified → trust-eligible

Trust Engine scoring **unchanged**.

## Privacy model

- Private bucket, signed access
- No street/ZIP persistence
- Phone shown in review, not stored on profile
- Verified employment survives resume deletion

## Security model

- Auth on all routes; path ownership checks
- Impersonation write block
- No resume text in logs
- Legacy unauthenticated upload disabled

## Test results

Run: `npm test -- tests/resume-intelligence.test.ts`

Covers: upload contract, file validation, date normalization, confidence mapping, duplicate detection, path privacy, verification boundary regression.

## Known limitations

- Phone not persisted (no profile column)
- Description/location/employment type not stored on `employment_records`
- Parse rate limit: 3/day per user
- Profile name only fills when empty (no silent overwrite)
- DOC parsing via mammoth (best-effort)

## Future improvements

- Wire profile upload to optional parse step
- Persist phone in profile schema if product requires
- OCR for scanned PDFs
- Batch re-parse on model upgrades
- E2E Playwright for full import flow

## Final review checklist

| Question | Answer |
|----------|--------|
| Upload works? | Yes — canonical `resume` field + `path` response |
| Identity extraction? | Yes — with confidence |
| Companies / titles / dates? | Yes |
| User can correct? | Yes — full review UI |
| Profile population? | Yes — opt-in confirm |
| Verification flow? | Yes — `/dashboard?openVerification=1` |
| Trust from verified only? | Yes — boundary preserved |
| Resume secure? | Yes — private storage, signed URLs |
| Existing workflows unaffected? | Yes — Greenhouse/Trust/Verification core untouched |

## Engineering principle

**The resume starts the employment story. Verification proves the story. Trust measures the proof.**
