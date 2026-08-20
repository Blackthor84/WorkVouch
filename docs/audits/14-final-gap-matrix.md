# 14 — Final Gap Matrix

**Date:** 2026-08-13

---

## Greenhouse Integration

| Feature | Current State | Exists? | Production Ready? | GH Dependency? | Security Concern? | Recommendation |
|---------|---------------|---------|-------------------|----------------|-------------------|----------------|
| Harvest V3 API | Using Harvest **V1** only | ✅ V1 | ❌ Not partner-compliant | **YES** | Low | Migrate to V3 + cursor pagination |
| V1 pagination (`page`) | Implemented | ✅ | ⚠️ Works on V1 only | YES | Low | Replace with cursor/Link header |
| Candidate sync | GET V1 candidates | ✅ | ⚠️ Mock-tested only | YES | Low | Rewrite for V3 |
| Job sync | GET V1 jobs | ✅ | ⚠️ Mock-tested only | YES | Low | Rewrite for V3 |
| Application sync | GET V1 applications | ✅ | ⚠️ Mock-tested only | YES | Low | Rewrite for V3 |
| Partner OAuth URLs | `/oauth/authorize` vs partner `/authorize` | ✅ | ❌ Unverified | **YES** | Medium | Confirm with Greenhouse |
| Partner OAuth token exchange | Form + PKCE vs Basic auth | ✅ | ❌ Unverified | **YES** | Medium | Align to partner guide |
| Granular V3 scopes | Using coarse `harvest:read/write/webhooks` | ✅ | ❌ Wrong scope model | **YES** | Medium | Request minimum granular scopes |
| PKCE | Always enabled | ✅ | UNKNOWN | YES | Low | Confirm with partner support |
| Token encryption | AES-256-GCM | ✅ | ✅ | No | Low | Keep |
| Token refresh | Implemented | ✅ | ⚠️ Unverified TTL/rotation | YES | Medium | Test 1h/24h lifecycle |
| Webhook HMAC ingress | Hookshot SHA256 | ✅ | ✅ | Partial | Low | Keep; validate payloads in sandbox |
| Partner webhook registration | Manual Hookshot only | ❌ API | N/A | YES | Low | Document; confirm partner process |
| Webhook event mapping | 13 actions | ✅ | ⚠️ Fixture-based | YES | Low | Validate real payloads |
| Persistent DLQ | Supabase-backed | ✅ | ✅ | No | Low | Keep |
| Embedded panel | Demo + live JWT | ✅ | ✅ Demo; ⚠️ live | YES | Low | Sandbox iframe test |
| Hiring Confidence | Engine + panel | ✅ | ✅ | No | Low | Keep |
| Employer portal | Full Connect UX | ✅ | ✅ | Partial | Low | Sandbox OAuth E2E |
| Marketplace docs | 11 files | ✅ | ⚠️ Needs V3 caveat | No | Low | Update stale provider docs |
| Demo video | Storyboard only | ❌ | ❌ | No | Low | Produce 2–5 min video |
| Screenshots | Not captured | ❌ | ❌ | Partial | Low | Capture 6 at 1280×800 |
| Partner credentials | Not issued | ❌ | ❌ | **YES** | — | Complete partnership agreement |

---

## Resume Intelligence

| Feature | Current State | Exists? | Production Ready? | GH Dependency? | Security Concern? | Recommendation |
|---------|---------------|---------|-------------------|----------------|-------------------|----------------|
| Resume file upload | PDF/DOC/DOCX, 5MB | ✅ | ✅ | No | Low | Keep |
| Private storage + signed URLs | Supabase bucket | ✅ | ✅ | No | Low | Keep |
| Consumer employment parse | OpenAI + pdf-parse/mammoth | ✅ | ⚠️ UI gap | No | Medium (AI) | Fix import UI contract |
| Enterprise parse | Rich JSON in workforce_resumes | ✅ | ⚠️ No UI | No | Medium | Build enterprise UI or defer |
| Profile name/email auto-fill | Not on consumer | ❌ | ❌ | No | Low | Product decision |
| User review before save | ImportResumeClient | ✅ | ⚠️ Broken upload path | No | Low | Fix field/response mismatch |
| employment_records insert | On confirm, pending | ✅ | ✅ | No | Low | Set `source: resume` |
| Verified vs claim distinction | verification_status enum | ✅ | ✅ | No | Low | Document clearly |
| Trust uses verified only | trustScore.ts filter | ✅ | ✅ | No | Low | Keep |
| Verified PDF export | Excludes pending | ✅ | ✅ | No | Low | Keep |
| Employment normalization | Consumer → employment_records | ✅ | ✅ | No | Low | Unify enterprise path |
| Address from resume | Not extracted (consumer) | N/A | ✅ Privacy-safe | No | Low | Do not add city/ZIP |
| Enterprise job location text | In parsed_json | ✅ | ⚠️ | No | Medium | Don't expose to employers |
| Resume delete API | Not implemented | ❌ | ❌ | No | Medium | Add delete flow |
| Virus scan | Not implemented | ❌ | ❌ | No | Medium | Evaluate ClamAV/service |
| Legacy `/api/resume-upload` | No auth | ✅ | ❌ | No | **HIGH** | Disable or remove |
| Resume → Greenhouse panel | Via verify → trust path | ⚠️ Indirect | Future | Partial | Low | V2 after partner launch |

---

## Verification Boundary (Cross-Cutting)

| Data type | Exists in code? | Trust-eligible? | GH panel? |
|-----------|-----------------|-----------------|-----------|
| Resume file (document) | ✅ profiles.resume_url | ❌ | ❌ |
| Resume claim (pending employment) | ✅ employment_records pending | ❌ | ❌ (unverified) |
| User-entered employment | ✅ manual entry | ❌ until verified | Partial |
| Verified employment | ✅ verification_status verified | ✅ | ✅ |
| Employer-verified | ✅ employer confirm route | ✅ | ✅ |
| Reference-verified | ✅ reference flow | ✅ | ✅ |
| Greenhouse-sourced employment | ⚠️ GH candidate data read, not stored as WV employment | N/A | Via GH stage/name |
| Trust-eligible employment | ✅ verified/matched only | ✅ | ✅ |

**Architectural gap:** `source` field not consistently set; enterprise `parsed_json` sits outside verification boundary.

---

## Priority Summary

| Priority | Item |
|----------|------|
| **P0** | Harvest V3 migration |
| **P0** | Partner OAuth alignment + credentials |
| **P0** | Sandbox validation |
| **P1** | Scope reduction to minimum granular set |
| **P1** | Stale provider doc rewrite |
| **P1** | Demo video + screenshots |
| **P1** | Fix resume import UI/API mismatch |
| **P2** | Disable legacy resume-upload route |
| **P2** | Resume delete API |
| **P3** | Enterprise resume UI normalization |
