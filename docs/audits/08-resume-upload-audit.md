# 08 — Resume Upload Audit

**Date:** 2026-08-13

---

## Executive Answer

**Can a WorkVouch user upload a resume?**  
**YES** — consumer upload flow exists. Enterprise workforce upload API exists; enterprise UI is a placeholder.

---

## Consumer Upload (Primary)

| Layer | Status | Path |
|-------|--------|------|
| Upload UI | ✅ EXISTS | `/upload-resume` → `components/upload-resume-form.tsx` |
| Profile UI | ✅ EXISTS | `components/profile/ProfileResumeActions.tsx` (view/download/replace) |
| Import UI | ✅ EXISTS | `/dashboard/import-resume` → `ImportResumeClient.tsx` |
| API | ✅ EXISTS | `POST /api/resume/upload` |
| Storage | ✅ EXISTS | Supabase bucket `resumes` (private) |
| DB | ✅ EXISTS | `profiles.resume_url`, `profiles.resume_uploaded_at` |

### File support

| Type | Supported |
|------|-----------|
| PDF | ✅ |
| DOC | ✅ |
| DOCX | ✅ |
| Max size | 5 MB |

### Security

| Control | Status |
|---------|--------|
| Authentication | ✅ Role `user` or `employee` |
| Authorization | ✅ Own profile only |
| Private bucket | ✅ `public = false` |
| Signed URLs (self) | ✅ `GET /api/resume/me` — 1 hour TTL |
| Signed URLs (employer) | ✅ `POST /api/resume/view` — 60s, paid subscription |
| Virus scanning | ❌ NOT IMPLEMENTED |
| Dedicated delete API | ❌ NOT IMPLEMENTED (replace via upsert only) |

### Storage path

- Pattern: `resumes/{userId}-{timestamp}.{ext}`
- Stored reference: `profiles.resume_url` = `resumes/{fileName}`

---

## Enterprise Workforce Upload

| Layer | Status | Path |
|-------|--------|------|
| API | ✅ EXISTS | `POST /api/workforce/resumes/upload` |
| DB | ✅ EXISTS | `workforce_resumes` table |
| UI | ❌ PLACEHOLDER | `app/enterprise/[orgId]/resume-imports/page.tsx` |

---

## Legacy / Unwired

| Item | Status |
|------|--------|
| `POST /api/resume-upload` | EXISTS — no auth, no storage (experimental) |
| `processResumeUpload()` in `lib/core/resume.ts` | EXISTS — not called by any route |
| `GET /api/resumes` | EXISTS — computed view from `employment_records`, not file uploads |

---

## Known Integration Gap

`ImportResumeClient.tsx` sends form field `"file"` and expects `{ path }`, but upload API expects `"resume"` and returns `{ success, url }`. **Import-from-upload flow may be broken in production UI** — document as finding, do not fix in this audit.

---

## Retention / Deletion

- No API to delete resume file and clear `profiles.resume_url`
- RLS DELETE policy exists in SQL setup scripts but no application route invokes it
- Parsed text not persisted (by design in parse route)

---

## Classification

| Question | Answer |
|----------|--------|
| Upload exists? | **YES** |
| Production ready? | **PARTIAL** — upload yes; import UI contract mismatch |
| Greenhouse dependency? | **NO** |
| Security concern? | **LOW** for consumer; workforce `getPublicUrl()` usage warrants review |
