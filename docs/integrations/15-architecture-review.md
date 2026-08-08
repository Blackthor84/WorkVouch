# 15 — Architecture Review

> **Sprint:** Operation Greenhouse — Sprint 2 (Design Only)  
> **Last updated:** 2026-08-07  
> **Reviewer:** Architecture audit (automated)  
> **Verdict:** APPROVED TO PROCEED TO SPRINT 3 with noted mitigations

---

## Executive Summary

The proposed ATS Integration Platform is **well-designed for enterprise use** and correctly isolates integration concerns from the existing WorkVouch application. The provider abstraction pattern will support future ATS providers with minimal platform changes. The primary risks are operational (queue scaling, token management) rather than architectural.

**Overall architecture grade: B+** (Strong design, some operational gaps to address in Sprint 3)

---

## Strengths

### 1. Additive Architecture ✅
The platform lives entirely in new directories (`lib/integrations/`, `app/api/integrations/`, `components/integrations/`). Zero modifications to trust engine, auth, billing, or verification core. This is the single most important design decision and it is correctly enforced throughout all 14 design documents.

### 2. Provider Abstraction ✅
The `AtsProvider` interface is comprehensive without being over-engineered. Adding Lever or Ashby requires only a new adapter — no Sync Engine, Event Bus, or API route changes. The contract test suite ensures consistency.

### 3. Event-Driven Design ✅
Decoupling webhook receipt from processing via `ats_events` queue prevents webhook timeouts and enables retry. The idempotency key design prevents duplicate processing. DLQ with manual replay provides operational safety net.

### 4. Security Design ✅
AES-256-GCM token encryption, HMAC webhook verification, PKCE OAuth, employer isolation, and least-privilege scopes are all correctly specified. The threat model covers the primary attack vectors.

### 5. Stripe Webhook Pattern Reuse ✅
Mirroring the proven `/api/stripe/webhook` pattern for ATS webhooks reduces implementation risk. The team already understands this pattern.

### 6. Read-Only Trust Export ✅
Trust scores are read from `trust_scores` and exported to ATS custom fields. The trust engine is never modified by integration code. This preserves the critical "do not modify trust engine" constraint from Sprint 1 audit.

### 7. Location Privacy Compliance ✅
The mapping service strips city/zip/coordinates from all inbound job/location data. Only country/state stored in `ats_job_map`. Aligns with WorkVouch location safety rules.

---

## Weaknesses

### 1. Database-Backed Queue (Phase 1) ⚠️

**Issue:** Using `ats_events` table as a queue via cron polling is simple but has limitations:
- Polling latency (up to 1 minute with 1-min cron)
- `FOR UPDATE SKIP LOCKED` requires careful implementation in Supabase
- No native priority queue
- Scaling to high webhook volume requires careful index tuning

**Mitigation:** Acceptable for Sprint 3–5 (expected volume: <1000 events/day). Plan Phase 2 upgrade to Supabase Edge Functions or Inngest before Sprint 8 GA. Document upgrade path in Sprint 3 implementation.

**Severity:** Medium — operational, not architectural

---

### 2. No Auto-Profile Creation ⚠️

**Issue:** Sprint 3 design explicitly does not create WorkVouch profiles for unmatched Greenhouse candidates. Employers must manually link or wait for email match. This limits the value proposition for high-volume recruiting teams.

**Mitigation:** Correct decision for Sprint 3 (privacy + scope control). Add optional auto-profile creation in Sprint 5 with explicit employer consent toggle. Document in UI that manual linking is required initially.

**Severity:** Low — product decision, not architectural flaw

---

### 3. Single Encryption Key ⚠️

**Issue:** All tokens encrypted with single `ATS_TOKEN_ENCRYPTION_KEY`. Key compromise exposes all employer tokens simultaneously.

**Mitigation:** Dual-key rotation support is designed. Consider per-employer encryption keys (derived from master key + employer_account_id) in Sprint 8 security hardening. Document key rotation procedure before Sprint 3 launch.

**Severity:** Medium — security

---

### 4. Polling-Based Trust Export ⚠️

**Issue:** Trust score export triggered by cron polling (`/api/cron/ats-trust-export`) rather than event-driven trigger on `trust_scores` UPDATE. This introduces up to 15-minute lag between score change and ATS export.

**Mitigation:** Acceptable for Sprint 3–4. Phase 2: add DB trigger or application hook on trust score update (requires explicit approval to touch trust write path). Document staleness in UI ("Last exported: 12 minutes ago").

**Severity:** Low — UX, not correctness

---

### 5. Provider-Specific Webhook URL ⚠️

**Issue:** Single webhook URL per provider (`/webhooks/greenhouse`) requires employer resolution from webhook payload. If payload lacks organization identifier, webhook cannot be routed.

**Mitigation:** Greenhouse includes organization ID in all webhook payloads (verified in API docs). Add fallback: if organization ID missing, log to `ats_webhook_log` with `status = 'no_connection'` and alert ops. Document required payload fields per provider.

**Severity:** Low — provider-specific, handled in adapter

---

## Scalability Limits

| Component | Current design limit | Bottleneck | Upgrade path |
|-----------|---------------------|-----------|--------------|
| Event queue | ~10,000 events/day | DB polling frequency | Edge Functions / Inngest |
| Trust export batch | ~500 candidates/cron run | Provider rate limits | Batch with backoff |
| Webhook receipt | ~100 req/min | Next.js serverless | Dedicated webhook worker |
| Concurrent connections | ~1,000 employers | DB connection pool | Supabase connection pooling |
| Sync log storage | ~1M rows/year | DB size | Archive to cold storage |
| Token refresh | ~1,000 connections/day | Cron runtime | Parallel refresh workers |

**Assessment:** Design supports expected Year 1 volume (100–500 employer connections, <10,000 events/day). Revisit queue architecture before 1,000+ active connections.

---

## Security Risks

| Risk | Likelihood | Impact | Status |
|------|-----------|--------|--------|
| Token theft via DB breach | Low | Critical | Mitigated (encryption) |
| Webhook forgery | Medium | High | Mitigated (HMAC) |
| Cross-employer data access | Low | Critical | Mitigated (RLS + ownership check) |
| OAuth CSRF | Low | High | Mitigated (state + PKCE) |
| Encryption key in code | Low | Critical | Requires ops discipline |
| Provider API key in logs | Medium | High | Requires code review gate |
| Location data leak | Low | High | Mitigated (mapper strips granular data) |
| Rate limit abuse (manual sync) | Medium | Low | Mitigated (internal rate limits) |

**No unresolved critical security risks** in the proposed design.

---

## Performance Bottlenecks

| Bottleneck | When it occurs | Mitigation |
|-----------|---------------|-----------|
| Greenhouse rate limit (100/10s) | Bulk trust export | Batch with 100ms delay between requests |
| DB polling overhead | >5000 events/day | Index on `(status, scheduled_at)` |
| Token decryption on every API call | High sync volume | In-memory token cache (5-min TTL, per-worker) |
| Webhook payload storage | High webhook volume | Supabase Storage with 30-day lifecycle |
| Sync log table growth | >6 months operation | Partition by month; archive old partitions |

---

## Technical Debt Introduced

| Debt item | Introduced by | Paydown sprint |
|-----------|--------------|----------------|
| DB-backed queue | Sprint 3 | Sprint 8 (Inngest migration) |
| Polling trust export | Sprint 3 | Sprint 5 (event hook) |
| Single encryption key | Sprint 3 | Sprint 8 (per-employer keys) |
| Partial TypeScript types for ats_* | Sprint 3 | Sprint 3 (type on creation) |
| No integration E2E tests | Sprint 3 | Sprint 4 |
| Manual webhook registration | Sprint 3 | Sprint 5 (automated) |

**Assessment:** Debt level is acceptable for a new platform. All items have planned paydown sprints.

---

## Future Improvements

### Near-term (Sprint 5–8)
1. **Event-driven trust export** — trigger on `trust_scores.calculated_at` change
2. **Supabase Edge Function workers** — replace cron polling for event processing
3. **Batch trust export API** — single GH API call for multiple candidates (if GH supports)
4. **Auto-profile creation** — with employer consent toggle
5. **Integration analytics** — employer-facing "ROI dashboard" (trust scores exported, candidates linked)

### Medium-term (Sprint 9–12)
6. **Enterprise org-level connections** — one GH connection per enterprise org, shared across locations
7. **Bi-directional application status** — WorkVouch verification status → GH application stage
8. **Webhook replay UI** — admin tool to replay any webhook from `ats_webhook_log`
9. **Provider health SLA dashboard** — public status page for integration uptime
10. **Inngest/Trigger.dev migration** — production-grade queue with native retry/DLQ

### Long-term (Year 2+)
11. **WorkVouch as GH assessment** — native Greenhouse assessment integration (requires GH partnership)
12. **Real-time sync via WebSockets** — push trust score changes instantly
13. **AI-powered candidate matching** — suggest WorkVouch profile matches for unmatched GH candidates
14. **Integration marketplace** — third-party developers build providers using `AtsProvider` SDK
15. **SOC2 Type II audit scope** — include integration platform in audit boundary

---

## Architecture Decision Records (ADRs)

| ADR | Decision | Rationale | Alternatives rejected |
|-----|----------|-----------|----------------------|
| ADR-001 | Additive-only architecture | Zero regression risk | Modifying existing routes |
| ADR-002 | Provider adapter pattern | Multi-provider support | Greenhouse-only hardcode |
| ADR-003 | DB-backed event queue (Phase 1) | No new infra | Inngest (deferred) |
| ADR-004 | AES-256-GCM token encryption | Industry standard | Supabase Vault (complexity) |
| ADR-005 | Single webhook URL per provider | Simpler registration | Per-employer webhook URLs |
| ADR-006 | Email-based auto-linking | Low friction | Manual only |
| ADR-007 | Read-only trust export | Trust engine safety | Bidirectional trust sync |
| ADR-008 | Country/state only for locations | Privacy compliance | Full location sync |
| ADR-009 | `/api/integrations/v1/` namespace | Versioning from day one | Unversioned (existing pattern) |
| ADR-010 | Cron-based workers | Existing pattern | Edge Functions (Phase 2) |

---

## Final Verdict

| Criterion | Assessment |
|-----------|-----------|
| Preserves existing application | ✅ Yes — fully additive |
| Supports multiple ATS providers | ✅ Yes — adapter pattern |
| Enterprise-grade security | ✅ Yes — with noted key rotation gap |
| Scalable to Year 1 volume | ✅ Yes |
| Scalable to 1000+ connections | ⚠️ Requires queue upgrade |
| Implementation-ready | ✅ Yes — Sprint 3 can begin |
| Remaining design decisions | 2 (queue Phase 2 timing, auto-profile creation) |

**Recommendation:** Proceed to Sprint 3 implementation. Resolve Greenhouse OAuth credentials and `ATS_TOKEN_ENCRYPTION_KEY` provisioning before Sprint 3 kickoff.

---

## Related Documents

- [01-system-architecture.md](./01-system-architecture.md)
- [14-implementation-roadmap.md](./14-implementation-roadmap.md)
- [docs/architecture/greenhouse-readiness-score.md](../architecture/greenhouse-readiness-score.md)
- [docs/architecture/08-risk-analysis.md](../architecture/08-risk-analysis.md)
