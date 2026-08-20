# 10 — Profile Population Audit

**Date:** 2026-08-13

---

## Field Classification Matrix

| Field | Consumer Resume | Enterprise Parse | Classification |
|-------|-----------------|------------------|----------------|
| Name | ❌ | ✅ in `parsed_json` | Enterprise: AUTO; Consumer: **NOT SUPPORTED** |
| Email | ❌ | ✅ in `parsed_json` | Enterprise: AUTO; Consumer: **NOT SUPPORTED** |
| Phone | ❌ | ✅ in `parsed_json` | Enterprise: AUTO; Consumer: **NOT SUPPORTED** |
| Address (street) | ❌ | ❌ | **NOT SUPPORTED** |
| City | ❌ | ⚠️ optional job `location` text | **NOT SUPPORTED** (enterprise job-level only) |
| State | ❌ | ❌ | **NOT SUPPORTED** |
| Country | ❌ | ❌ | **NOT SUPPORTED** |
| Employer | ✅ via confirm | ✅ in job_history | **OPTIONAL** — user must confirm (consumer) |
| Job Title | ✅ via confirm | ✅ | **OPTIONAL** |
| Start Date | ✅ via confirm | ✅ | **OPTIONAL** |
| End Date | ✅ via confirm | ✅ | **OPTIONAL** |
| Current Employer | ✅ `is_current` | ✅ | **OPTIONAL** |
| Employment Description | ❌ | ❌ | **NOT SUPPORTED** |
| Skills | ❌ | ✅ in `parsed_json` | Enterprise only; **NOT on profile** |
| Education | ❌ | ❌ | **NOT SUPPORTED** |
| Certifications | ❌ | ✅ in `parsed_json` | Enterprise only; **NOT on profile** |

---

## Consumer Flow (After Upload)

1. User uploads file → `profiles.resume_url` updated
2. Optional: `/dashboard/import-resume` → parse → **review UI** → confirm
3. Confirm inserts `employment_records` with `verification_status: "pending"`
4. **Profile fields (name, headline, etc.) are NOT updated from resume**

### User review / correction

| Step | Status |
|------|--------|
| Review extracted jobs before save | ✅ `ImportResumeClient` edit step |
| Correct company/title/dates | ✅ Before confirm |
| Auto-save without review | ❌ Confirm required |

---

## Enterprise Flow

- Parse stores full JSON on `workforce_resumes`
- No evidence of auto-sync to `profiles` or `workforce_employees` fields from parse
- UI not implemented for review

---

## Answer: Does resume automatically populate profile?

**NO for profile identity fields.**  
**PARTIAL for employment history** — only after explicit user confirm (consumer), and only into `employment_records` as unverified claims.

---

## Greenhouse Connect Impact

- Greenhouse links candidates by **email match**
- Resume does not feed Greenhouse panel directly
- Verified employment (post-verification) could eventually display in panel via existing trust/employment APIs
