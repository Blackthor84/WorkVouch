# 15 — Final Engineering Review

> **Sprint:** Operation Greenhouse — Sprint 2.75 (Integration Contracts)  
> **Last updated:** 2026-08-07  
> **Reviewer role:** Principal Engineer / Enterprise Architecture Review  
> **Status:** Design complete — ready for Sprint 3 engineering

---

## Review Questions

### 1. Is the architecture internally consistent?

**Yes — with one minor naming alignment needed.**

Cross-document verification:

| Contract | Aligns with Sprint 2 Architecture | Status |
|----------|----------------------------------|--------|
| Domain model (01) ↔ Provider interface (Sprint 2) | Canonical types match | ✅ |
| Field mapping (02) ↔ Sync engine (Sprint 2) | Export fields match | ✅ |
| Status mapping (03) ↔ Product experience (Sprint 2.5) | Status enums match | ✅ |
| Webhook contract (04) ↔ Webhook design (Sprint 2) | Events, auth, flow match | ✅ |
| API contract (05) ↔ API design (Sprint 2) | Endpoints match | ✅ |
| Sync contract (06) ↔ Sync engine (Sprint 2) | Directions, conflicts match | ✅ |
| Custom fields (07) ↔ Sync engine export table | 12 fields match | ✅ |
| Automation rules (08) ↔ Product settings (Sprint 2.5) | Presets, triggers match | ✅ |
| Error catalog (09) ↔ Error hierarchy (Sprint 2) | Error codes match | ✅ |
| Provider manifest (13) ↔ Provider interface (Sprint 2) | Features match | ✅ |
| Implementation checklist (14) ↔ Roadmap (Sprint 2) | Sprint assignments match | ✅ |

**Minor inconsistency:** Architecture audit (Sprint 1) references `/api/integrations/greenhouse/v1/` while Sprint 2+ standardizes on `/api/integrations/v1/`. **Resolution:** Use `/api/integrations/v1/` (provider-agnostic namespace). Sprint 1 doc is superseded.

**Location safety:** All contracts enforce country/state only. No city/ZIP/coordinates in any field mapping or sync rule. ✅

**Privacy rules:** Vouch text, reference names, and verifier identity never exported. Consistent across 01, 02, 06, 07, 13. ✅

---

### 2. Are there unresolved decisions?

**7 decisions remain before Sprint 3 engineering begins.**

| # | Decision | Options | Recommendation | Blocking? |
|---|----------|---------|----------------|-----------|
| D-001 | GH panel delivery mechanism | Custom Field iframe vs Partner sidebar extension | **Partner sidebar extension** (preferred by GH marketplace); implement iframe fallback | Yes — T-010 |
| D-002 | GH OAuth app credentials | Sandbox + production apps | Register sandbox app immediately | Yes — T-003 |
| D-003 | Auto-profile creation | Create WV profile on GH webhook vs invite-only | **Invite-only for Sprint 3** (already decided in sync engine) | No |
| D-004 | Panel authentication | JWT panel token vs session cookie | **JWT panel token** (15-min expiry, signed with server secret) | Yes — T-010 |
| D-005 | GH stage name mapping | Hardcoded defaults vs employer-configurable | **Hardcoded defaults Sprint 3**; configurable in Sprint 5 | No |
| D-006 | Support SLA and contact | support@workvouch.com vs help desk | Confirm email + 24h SLA before marketplace submission | No — T-020 |
| D-007 | Token encryption key management | Environment variable vs KMS | **Environment variable Sprint 3**; KMS Sprint 6+ | No |

---

### 3. Could another engineering team implement this without asking questions?

**Yes — for Sprint 3 core scope (85% of integration).**

An engineering team with these documents can implement without clarification:

| Area | Completeness | Notes |
|------|-------------|-------|
| Database schema | 100% | Column-level spec in Sprint 2 DB design |
| OAuth flow | 100% | Sequence diagram + error catalog |
| Webhook handling | 100% | Payload examples + validation rules |
| Field mapping | 100% | Every field with direction, transform, conflict |
| Custom fields | 100% | 12 fields with types, names, refresh rules |
| Sync engine | 100% | Direction matrix + conflict resolution |
| API endpoints | 100% | Request/response schemas |
| Error handling | 100% | 30+ error codes with recovery |
| Automation rules | 100% | 15 rules with JSONB schema |
| Testing | 100% | 80+ test cases across all levels |
| Implementation tasks | 100% | 20 tasks with hours, deps, DoD |

**Areas requiring external input (not internal docs):**

| Area | External dependency |
|------|-------------------|
| GH OAuth app registration | Greenhouse developer portal |
| GH sandbox access | Greenhouse partnership team |
| GH panel iframe API | Greenhouse partner documentation |
| GH custom field API limits | Verify max fields per org |
| Production deployment | DevOps/infrastructure team |

---

## Remaining Decisions Before Sprint 3

### Must resolve (Sprint 3 blockers)

1. **D-001: Panel delivery mechanism** — Engineering spike (4 hours) to test GH Partner sidebar extension API vs custom field iframe. Document findings and finalize.

2. **D-002: GH OAuth credentials** — Register sandbox OAuth application. Store credentials in environment variables. Required before T-003.

3. **D-004: Panel auth token format** — Define JWT claims: `{ employerAccountId, externalCandidateId, provider, exp, iat }`. Sign with `PANEL_JWT_SECRET`.

### Should resolve (Sprint 3 quality)

4. **D-005: Stage name mapping** — Document default mapping table (already in 03-status-mapping.md). Confirm with GH sandbox that stage names match.

5. **D-007: Encryption key** — Document key rotation procedure. Use `ATS_ENCRYPTION_KEY` env var (32 bytes, base64).

### Can defer (Sprint 4+)

6. **D-003: Auto-profile creation** — Already deferred to Sprint 5.

7. **D-006: Support SLA** — Required before marketplace submission (Sprint 5), not Sprint 3.

---

## Architecture Risk Assessment

| Risk | Severity | Mitigation | Status |
|------|----------|------------|--------|
| GH API rate limits during initial sync | Medium | Batch with backoff; respect Retry-After | ✅ Designed |
| Email matching false positives | Medium | Ambiguous state + manual review | ✅ Designed |
| Token expiry during bulk export | Low | Proactive daily refresh | ✅ Designed |
| Webhook delivery gaps | Low | 6-hour cron catch-up sync | ✅ Designed |
| GH custom field limits | Medium | Verify with sandbox; 12 fields within typical limits | ⬜ Verify D-002 |
| Panel iframe CSP restrictions | Medium | Test in GH sandbox; fallback to external link | ⬜ Verify D-001 |
| AI summary quality | Low | Structured fallback always available | ✅ Designed |
| Concurrent sync conflicts | Low | Per-item isolation in batch | ✅ Designed |

---

## Document Completeness Score

| Document | Complete | Engineering-ready |
|----------|----------|-------------------|
| 01-domain-model.md | ✅ | ✅ |
| 02-field-mapping.md | ✅ | ✅ |
| 03-status-mapping.md | ✅ | ✅ |
| 04-webhook-contract.md | ✅ | ✅ |
| 05-api-contract.md | ✅ | ✅ |
| 06-sync-contract.md | ✅ | ✅ |
| 07-custom-fields.md | ✅ | ✅ |
| 08-automation-rules.md | ✅ | ✅ |
| 09-error-catalog.md | ✅ | ✅ |
| 10-sequence-diagrams.md | ✅ | ✅ |
| 11-testing-matrix.md | ✅ | ✅ |
| 12-marketplace-readiness.md | ✅ | ✅ |
| 13-provider-manifest.md | ✅ | ✅ |
| 14-implementation-checklist.md | ✅ | ✅ |
| 15-final-engineering-review.md | ✅ | ✅ |
| greenhouse-launch-readiness.md | ✅ | ✅ |

**Total: 16/16 documents complete.**

---

## Sign-Off

| Role | Assessment | Sprint 3 Ready? |
|------|-----------|-----------------|
| Architecture | Internally consistent; 3 blockers identified | ✅ After D-001, D-002, D-004 |
| API Design | Complete request/response contracts | ✅ |
| Data Mapping | Every field documented with conflict rules | ✅ |
| Security | Encryption, HMAC, RLS, privacy rules | ✅ |
| Testing | 80+ test cases defined | ✅ |
| Implementation | 20 tasks with 244 hours estimated | ✅ |

**Sprint 2.75 Status: COMPLETE**

**Recommendation:** Resolve 3 blockers (D-001, D-002, D-004) in a 1-day engineering spike, then begin Sprint 3 T-001 (database migrations).

---

## Related Documents

- [greenhouse-launch-readiness.md](./greenhouse-launch-readiness.md)
- [14-implementation-checklist.md](./14-implementation-checklist.md)
- [docs/integrations/15-architecture-review.md](../integrations/15-architecture-review.md)
- [docs/product-experience/final-product-review.md](../product-experience/final-product-review.md)
