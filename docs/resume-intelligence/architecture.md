# Resume Intelligence Architecture

## Overview

Resume Intelligence turns an uploaded resume into **reviewable claims** — identity and employment — that enter the existing WorkVouch verification pipeline. A resume is evidence of a claim, not proof of employment.

## Canonical chain

```
RESUME → PARSE → USER REVIEW → CONFIRM → PENDING employment_records → VERIFICATION → VERIFIED → TRUST
```

## Components

| Layer | Location | Role |
|-------|----------|------|
| Upload API | `POST /api/resume/upload` | Auth, validation, private storage, profile `resume_url` |
| Parse API | `POST /api/resume/parse` | Text extraction + OpenAI structured parse |
| Confirm API | `POST /api/resume/confirm` | User-confirmed pending records + optional profile |
| Delete API | `DELETE /api/resume` | Remove file; does not delete employment |
| Shared lib | `lib/resume/*` | Contracts, parsing, duplicates, confidence |
| UI | `ImportResumeClient` | Upload → review → confirm → verification CTA |

## Storage

- Bucket: `resumes` (private)
- Object key: `{userId}-{timestamp}.{ext}`
- Profile reference: `resumes/{objectKey}`

## Employment model

All resume-derived jobs use **`employment_records`** with:

- `verification_status = pending`
- `source = resume` (when column exists)

No parallel `resume_jobs` or `resume_employment` tables.

## Trust boundary

Trust Engine reads **verified** employment only. Resume parsing never sets `verification_status = verified`.

## Non-goals

- Does not modify Greenhouse Connect, Trust scoring, or Verification Engine core logic
- Does not auto-verify resume claims
