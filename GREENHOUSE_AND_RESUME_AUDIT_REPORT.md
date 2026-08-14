# Greenhouse & Resume Audit Report

**Operation:** Greenhouse Audit Sprint  
**Date:** 2026-08-13  
**Type:** Discovery only — **no code changes**  
**Branch reviewed:** `feature/greenhouse-platform` @ `7dfe5c5d`

---

## Executive Summary

WorkVouch Connect is a **mature internal integration platform** (OAuth, webhooks, event store, employer portal, embedded panel, production hardening) built against **Greenhouse Harvest V1**, not the **Harvest V3 Partner API** required for official Greenhouse marketplace certification.

Resume intelligence **exists** for consumer users (upload + AI employment extraction + manual confirm) but **does not auto-populate profiles** and has a **known import UI/API mismatch**. Verified employment is **clearly separated** from resume claims in the trust model.

**Bottom line:** Strong foundation; **not partner-certified yet**. Sandbox credentials will unblock validation, but **engineering work is required** (V3 + OAuth alignment) before sandbox testing can succeed.

---

## Greenhouse Readiness: **NOT READY** (Partner Program)

| Area | Score | Status |
|------|-------|--------|
| Connect platform | 85/100 | Built |
| Partner API compliance | 25/100 | V1 + legacy OAuth |
| Documentation | 70/100 | Marketplace good; provider docs stale |
| Demo assets | 30/100 | Script yes; video/screenshots no |
| Sandbox validation | 0/100 | Blocked |

---

## Final Questions (Explicit Answers)

### Greenhouse

**1. Are we actually using Harvest V3?**  
**NO.** We use `https://harvest.greenhouse.io/v1` exclusively.

**2. Is our OAuth compatible with Greenhouse Partner OAuth?**  
**PARTIALLY.** Authorization Code flow yes; URLs, token auth method, and scopes differ from the [official partner guide](https://harvestdocs.greenhouse.io/docs/harvest-partner-oauth).

**3. Are our webhooks compatible with partner webhook requirements?**  
**PARTIALLY.** HMAC Hookshot ingress is solid; partner registration mechanism and V3 payload shapes are **UNKNOWN UNTIL SANDBOX**.

**4. What must change before sandbox testing?**  
- Obtain partner credentials  
- Align OAuth URLs and token exchange with partner guide  
- Replace scopes with approved granular V3 scopes  
- Plan Harvest V3 client migration (pagination + endpoints)  
- Register redirect URI with Greenhouse  

**5. What can we test immediately?**  
Connect platform, mock webhooks, demo panel, employer portal UI, trust/confidence, DLQ/replay, env validation, 311 automated tests.

**6. What must wait for Greenhouse?**  
Real OAuth, V3 API, webhooks, permissions, pagination, iframe panel, partner approval.

**7. Are support documentation and demo materials ready?**  
**PARTIAL.** Internal marketplace package complete; **demo video and screenshots missing**; provider docs stale.

### Resume

**8. Can a WorkVouch user upload a resume?**  
**YES** — `/upload-resume`, `POST /api/resume/upload`.

**9. What happens after upload?**  
File stored in private Supabase bucket; `profiles.resume_url` updated. Optional import path parses employment via OpenAI (separate step).

**10. Does the resume automatically populate their profile?**  
**NO** for identity fields. **PARTIAL** for employment — only after parse + user confirm into `employment_records` as **pending** claims.

**11. Can we extract?**

| Field | Consumer | Enterprise |
|-------|----------|------------|
| Name | ❌ | ✅ |
| Companies | ✅ | ✅ |
| Dates | ✅ | ✅ |
| Job titles | ✅ | ✅ |
| Addresses | ❌ | ⚠️ job location text only |

**12. Is resume information distinguished from verified employment?**  
**YES.** Pending claims vs `verification_status: verified`; trust score uses verified only.

**13. Can resume-derived employment feed Verification and Trust?**  
**YES** — via confirm → pending → verification → verified → trust → Greenhouse panel (email-linked).

**14. Security/privacy issues with resumes and addresses?**  
Consumer path is privacy-safe (no address extraction). Concerns: no delete API, no virus scan, legacy unauthenticated upload route, OpenAI receives full text, enterprise `parsed_json` PII.

**15. What should the NEXT engineering sprint be?**  
**Harvest V3 + Partner OAuth Migration Sprint** (blocked on partner credentials — start doc/scaffold work in parallel). Secondary: **Resume Import Fix Sprint** (UI/API mismatch, disable legacy route).

---

## Harvest V3 Readiness

| Item | Status |
|------|--------|
| V3 base URL | ❌ |
| Cursor pagination | ❌ |
| V3 response mappers | ❌ |
| V3 scopes | ❌ |

See [docs/audits/02-harvest-v3-audit.md](docs/audits/02-harvest-v3-audit.md)

---

## OAuth Readiness

| Item | Status |
|------|--------|
| Authorization Code flow | ✅ Conceptual |
| Partner URLs | ❌ Mismatch |
| Basic auth token exchange | ❌ Not implemented |
| Granular scopes | ❌ |
| PKCE | ✅ Implemented (compatibility unknown) |
| Token storage | ✅ |

See [docs/audits/03-partner-oauth-audit.md](docs/audits/03-partner-oauth-audit.md)

---

## Webhook Readiness

| Item | Status |
|------|--------|
| HMAC verification | ✅ |
| Event routing | ✅ |
| DLQ + replay | ✅ |
| Partner registration | ❌ Manual only |

See [docs/audits/04-partner-webhook-audit.md](docs/audits/04-partner-webhook-audit.md)

---

## Sandbox Blockers

1. Partner OAuth client ID/secret  
2. Signed partnership agreement (if not complete)  
3. Approved scope list from Greenhouse  
4. Registered redirect URI  
5. Harvest V3 migration (engineering)  

See [docs/audits/06-greenhouse-sandbox-dependencies.md](docs/audits/06-greenhouse-sandbox-dependencies.md)

---

## Documentation Status

| Package | Status |
|---------|--------|
| `docs/marketplace/` | COMPLETE (needs V3 caveat) |
| `docs/connect/` | COMPLETE |
| `docs/providers/greenhouse/` | **STALE** |
| Demo video | **MISSING** |
| Screenshots | **MISSING** |

See [docs/audits/07-greenhouse-documentation-audit.md](docs/audits/07-greenhouse-documentation-audit.md)

---

## Resume Upload Status

**EXISTS** — consumer + workforce API. See [docs/audits/08-resume-upload-audit.md](docs/audits/08-resume-upload-audit.md)

---

## Resume Parsing Status

**EXISTS** — consumer (employment only) + enterprise (full JSON). See [docs/audits/09-resume-parsing-audit.md](docs/audits/09-resume-parsing-audit.md)

---

## Profile Population Status

**PARTIAL** — employment only with user confirm; no auto profile fields. See [docs/audits/10-profile-population-audit.md](docs/audits/10-profile-population-audit.md)

---

## Employment Data Status

Canonical model: `employment_records`. Consumer resume normalizes correctly after confirm. See [docs/audits/11-employment-normalization-audit.md](docs/audits/11-employment-normalization-audit.md)

---

## Security Findings

See [docs/audits/12-resume-security-audit.md](docs/audits/12-resume-security-audit.md)

| Finding | Severity |
|---------|----------|
| Harvest V1 vs partner V3 | P0 |
| OAuth URL/token mismatch | P0 |
| Legacy `/api/resume-upload` no auth | P1 |
| Import UI/API mismatch | P1 |
| No resume delete | P2 |

---

## Architecture Gaps

1. **Two Greenhouse API generations** — code on V1, partner program on V3  
2. **Two OAuth profiles** — PKCE + form auth vs partner Basic auth  
3. **Two resume tracks** — consumer vs enterprise not unified  
4. **Legacy `jobs` table** — parallel to `employment_records`  
5. **`source: resume` not on confirm route** — provenance gap  

---

## Recommended Next Steps

### Immediate (No Code — This Sprint)

- [x] Complete audit deliverables (`docs/audits/`)
- [ ] Contact `partner-support@greenhouse.io` with integration name, redirect URI, minimum scope list
- [ ] Confirm partnership agreement status
- [ ] Schedule demo video recording (2–5 min)
- [ ] Capture 6 marketplace screenshots from demo mode

### Next Engineering Sprint (After Credentials or Parallel Scaffold)

1. **Harvest V3 migration** — `HarvestClient`, pagination, mappers, sync cursor  
2. **Partner OAuth alignment** — URLs, Basic auth, granular scopes, remove unused write/webhooks scopes  
3. **Sandbox E2E test plan** — OAuth, one webhook, one import cycle, panel iframe  

### Parallel (Resume — Smaller Sprint)

1. Fix `ImportResumeClient` ↔ `/api/resume/upload` contract  
2. Disable or gate `/api/resume-upload`  
3. Set `source: "resume"` on confirm route  

### Product Decisions Needed

- Minimum Greenhouse MVP scope approval  
- Site Admin connect requirement messaging  
- Resume → Greenhouse invite automation (V2)  
- Enterprise resume UI priority  

---

## Audit Deliverables Index

| # | Document |
|---|----------|
| 01 | [greenhouse-partner-audit.md](docs/audits/01-greenhouse-partner-audit.md) |
| 02 | [harvest-v3-audit.md](docs/audits/02-harvest-v3-audit.md) |
| 03 | [partner-oauth-audit.md](docs/audits/03-partner-oauth-audit.md) |
| 04 | [partner-webhook-audit.md](docs/audits/04-partner-webhook-audit.md) |
| 05 | [greenhouse-scope-audit.md](docs/audits/05-greenhouse-scope-audit.md) |
| 06 | [greenhouse-sandbox-dependencies.md](docs/audits/06-greenhouse-sandbox-dependencies.md) |
| 07 | [greenhouse-documentation-audit.md](docs/audits/07-greenhouse-documentation-audit.md) |
| 08 | [resume-upload-audit.md](docs/audits/08-resume-upload-audit.md) |
| 09 | [resume-parsing-audit.md](docs/audits/09-resume-parsing-audit.md) |
| 10 | [profile-population-audit.md](docs/audits/10-profile-population-audit.md) |
| 11 | [employment-normalization-audit.md](docs/audits/11-employment-normalization-audit.md) |
| 12 | [resume-security-audit.md](docs/audits/12-resume-security-audit.md) |
| 13 | [resume-greenhouse-opportunity.md](docs/audits/13-resume-greenhouse-opportunity.md) |
| 14 | [final-gap-matrix.md](docs/audits/14-final-gap-matrix.md) |

---

## Success Criteria Met

| Criterion | Met |
|-----------|-----|
| What is built | ✅ Documented |
| What is compliant | ✅ V1 internal MVP; not V3 partner |
| What is not compliant | ✅ Documented |
| What is blocked | ✅ Sandbox credentials |
| What needs sandbox | ✅ Listed |
| What needs engineering | ✅ V3 + OAuth |
| What needs product decision | ✅ Scopes, resume GH flow |
| No code changes | ✅ Audit only |

**NO GUESSING on V3/OAuth compatibility — code inspected. UNKNOWN items flagged for sandbox.**
