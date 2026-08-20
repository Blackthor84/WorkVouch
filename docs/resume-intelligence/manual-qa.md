# Resume Intelligence — Manual QA Checklist

Use this checklist to validate **real-world resume parsing** before production release.  
Do **not** commit real resumes to the repository. Test in a staging environment with test accounts.

---

## Prerequisites

- [ ] Staging environment with `OPENAI_API_KEY` configured
- [ ] Two test employee accounts: **User A** and **User B**
- [ ] Signed in as User A in one browser; User B in another (or incognito)
- [ ] Route: `/dashboard/import-resume`

---

## Resume A — Simple chronological (1 page)

**Profile:** Single column, 2–3 jobs, clear dates, name/email/phone in header.

| Step | Action | Expected |
|------|--------|----------|
| 1 | Upload PDF | Success; returns `path` |
| 2 | Parse | Identity fields populated with confidence badges |
| 3 | Review employment | 2–3 jobs with company, title, start/end dates |
| 4 | Confirm | Pending records created; verification CTA shown |
| 5 | Dashboard | New jobs show as **pending**, not verified |

**Record:** Parser accuracy notes, any missed jobs, date errors.

---

## Resume B — Modern two-column layout

**Profile:** Skills sidebar, contact block, less obvious employment section.

| Step | Action | Expected |
|------|--------|----------|
| 1 | Upload DOCX | Success |
| 2 | Parse | Name and at least one job extracted |
| 3 | Low confidence | Some fields show Medium/Low — editable |
| 4 | Edit mistakes | Changes persist in review form |
| 5 | Confirm | Only confirmed data saved |

**Record:** Whether layout confused parser; false extractions.

---

## Resume C — Multiple employers (5+ jobs)

**Profile:** Long work history, overlapping or short-term roles.

| Step | Action | Expected |
|------|--------|----------|
| 1 | Upload PDF | Success |
| 2 | Parse | Multiple employment entries (may be partial) |
| 3 | Remove bad entries | Can delete before confirm |
| 4 | Add missing job | Manual add works |
| 5 | Confirm | All confirmed rows become pending records |

**Record:** Count extracted vs actual; duplicate detection behavior.

---

## Resume D — Current employment ("Present")

**Profile:** Latest job end date is "Present" or "Current".

| Step | Action | Expected |
|------|--------|----------|
| 1 | Upload PDF or DOCX | Success |
| 2 | Parse | Latest job has `is_current: true`, null end date |
| 3 | Confirm | Record saved with `is_current: true` |
| 4 | Trust | Score unchanged until verification completes |

---

## Resume E — Messy / complex (optional)

**Profile:** Tables, graphics, columns, non-standard headings, or scanned PDF.

| Step | Action | Expected |
|------|--------|----------|
| 1 | Upload | May succeed even if parse fails |
| 2 | Parse failure | Clear error + manual entry path |
| 3 | TXT fallback | If PDF fails, try plain-text export as `.txt` |

**Record:** Whether scanned PDF fails (expected without OCR).

---

## Format matrix (repeat upload → parse for each)

Use a **single known-good resume** converted to each format where possible.

| Format | Upload | Parse | Identity | Employment | Notes |
|--------|--------|-------|----------|------------|-------|
| PDF | ☐ | ☐ | ☐ | ☐ | |
| DOCX | ☐ | ☐ | ☐ | ☐ | |
| DOC | ☐ | ☐ | ☐ | ☐ | Legacy Word; mammoth best-effort |
| TXT | ☐ | ☐ | ☐ | ☐ | Verify bucket accepts `text/plain` in staging |

---

## Identity and profile protection

Test with User A who **already has** profile name, city, and state filled in.

| Step | Action | Expected |
|------|--------|----------|
| 1 | Parse resume with different name/location | Shown in review only |
| 2 | Confirm **without** "Update my profile" checked | Profile unchanged |
| 3 | Confirm **with** checkbox | Name unchanged if already set; verify city/state behavior |
| 4 | Email | Auth email not overwritten |

**Flag if:** Profile fields change without explicit opt-in.

---

## Duplicate employment

Setup: User A already has verified employment at "Acme Corp — Engineer".

| Step | Action | Expected |
|------|--------|----------|
| 1 | Import resume with same employer/title | Duplicate warning shown |
| 2 | Choose **Keep existing** | No new record |
| 3 | Re-import; choose **Update existing** | Existing row updated; status → pending |
| 4 | Re-import; choose **Create separate** | Second record created |

---

## Verification handoff

| Step | Action | Expected |
|------|--------|----------|
| 1 | After confirm, click **Start verification** | Verification modal opens on dashboard |
| 2 | Complete verification (existing flow) | Employment becomes verified |
| 3 | Trust score | Increases only after verification (not at confirm) |

---

## Deletion lifecycle

| Step | Action | Expected |
|------|--------|----------|
| 1 | Upload and confirm employment | File + pending records exist |
| 2 | `DELETE /api/resume` (or UI if wired) | File removed; profile `resume_url` cleared |
| 3 | Employment records | Pending and verified records **remain** |
| 4 | Trust | Unchanged for verified records |
| 5 | Signed URL from old link | Expired / inaccessible |

---

## Authorization (User A vs User B)

| Step | Action | Expected |
|------|--------|----------|
| 1 | User A uploads resume | Success |
| 2 | User B calls parse with User A's `path` | **403 Invalid file path** |
| 3 | User B calls `GET /api/resume/me` | User B's own resume only (404 if none) |
| 4 | Direct bucket URL (no signature) | Access denied |
| 5 | `POST /api/resume-upload` | **410 Gone** |

---

## Address privacy

Use a test resume containing:

```
123 Main Street, Apt 4B
Springfield, IL 62701
USA
```

| Step | Action | Expected |
|------|--------|----------|
| 1 | Parse | Review shows city/state/country only |
| 2 | Confirm profile update | No street or ZIP in profile fields |
| 3 | Employer view | No full street address exposed |

---

## Logging spot-check (staging)

During one upload + parse + confirm:

- [ ] Server logs contain **no** full resume text
- [ ] Logs contain **no** signed URLs (client receives them; server should not log)
- [ ] Audit log entries contain path + counts only

---

## Sign-off

| Tester | Date | Environment | Result |
|--------|------|-------------|--------|
| _Pending_ | — | staging | **NOT YET EXECUTED** |

---

## Sprint 11.2 — Manual QA status (2026-08-13)

**Automated remediation complete. Real-resume testing not performed in engineering.**

This checklist must be executed by a human tester on staging before unconditional production GO.

| Resume | Upload | Parse | Identity | Employment | Confirm | Verification | Status |
|--------|--------|-------|----------|------------|---------|--------------|--------|
| A — Simple chronological | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Pending |
| B — Two-column | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Pending |
| C — Multiple employers | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Pending |
| D — Current employment | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Pending |
| E — Complex/messy | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Pending |

**Format matrix (TXT):** After migration `20260813220000`, verify TXT upload on staging — ☐ Pending

**Notes:**
