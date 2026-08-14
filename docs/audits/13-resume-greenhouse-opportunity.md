# 13 — Resume → Greenhouse Opportunity

**Date:** 2026-08-13  
**Scope:** Architecture assessment only — **do not build**

---

## Potential Future Flow

```
Candidate uploads resume
        ↓
WorkVouch extracts employment history
        ↓
Candidate reviews / corrects
        ↓
WorkVouch requests verification
        ↓
Employment becomes verified
        ↓
Trust + Hiring Confidence update
        ↓
Greenhouse Connect panel shows verified data (email-linked candidate)
```

---

## Current Architecture Support

| Step | Supported today? | Evidence |
|------|------------------|----------|
| Resume upload | ✅ | `/api/resume/upload` |
| Extract employment | ✅ (consumer) | `/api/resume/parse` |
| User review | ✅ (with UI gap) | `ImportResumeClient` |
| Save as unverified claim | ✅ | `employment_records` pending |
| Request verification | ✅ | Existing verification flows |
| Trust update on verify | ✅ | `trustScore.ts` filters verified only |
| Greenhouse panel display | ✅ | `GreenhousePanelService` aggregates trust/employment |
| Email link GH candidate ↔ WV profile | ✅ | `connect_candidate_map` by email |

**Verdict:** The **pipeline is architecturally viable** without a second employment system (consumer path).

---

## Missing Pieces

| Gap | Impact |
|-----|--------|
| Import UI/API contract mismatch | Blocks smooth resume → employment flow |
| No name/email extraction (consumer) | Weakens GH email match for new users |
| Enterprise parse not normalized | Workforce track isolated |
| `source: "resume"` not on confirm | Harder to audit claim provenance |
| No automated "invite to verify" after import | Manual lifecycle |
| Greenhouse is read-only | No write-back of verification status to GH |
| Harvest V1/V3 migration | Unrelated to resume but blocks partner launch |

---

## Greenhouse-Specific Value

| Value | Mechanism |
|-------|-----------|
| Faster candidate onboarding | Resume → verify before GH application peaks |
| Richer panel data | More verified employment → higher Hiring Confidence |
| Recruiter trust | Verified claims vs GH-unverified application data |

**WorkVouch does NOT replace Greenhouse candidate records** — it enriches the embedded panel for linked profiles.

---

## Product Decision Required

Should WorkVouch prompt GH-linked candidates to upload/verify resume when panel shows `not_linked`?

- Demo scenario exists: `not_linked` panel state
- Automation rules could trigger invite — lifecycle engine supports invites
- **Not implemented** as resume-specific GH workflow

---

## Recommendation

Resume → Verify → Trust → Greenhouse panel is a **valid V2 product story** built on existing primitives. **Do not prioritize before Harvest V3 partner migration and sandbox validation.**
