# 05 — Risk Register

> **Sprint:** Operation Greenhouse — Sprint 2.9 (MVP Lock)  
> **Last updated:** 2026-08-07

---

## Risk Matrix

| ID | Risk | Category | Likelihood | Impact | Mitigation | Owner | Status |
|----|------|----------|------------|--------|------------|-------|--------|
| R-01 | GH OAuth sandbox credentials delayed | Dependencies | Medium | High | Register app immediately; use MockAtsAdapter for parallel dev | Engineering | Open |
| R-02 | GH panel iframe/CSP restrictions block embedding | Technical | Medium | High | 4-hour spike; fallback to external link + GH custom field | Engineering | Open |
| R-03 | GH marketplace review rejection | Marketplace | Low | High | Demo environment + 6 screenshots + video; follow checklist | Product | Open |
| R-04 | GH API rate limits during initial sync | Performance | Medium | Medium | Batch with backoff; respect Retry-After; schedule off-peak | Engineering | Mitigated |
| R-05 | Email auto-link false positives | Product | Medium | Medium | Ambiguous state + manual review; never auto-link on 2+ matches | Engineering | Mitigated |
| R-06 | Token expiry during bulk export | Technical | Low | Medium | Proactive daily refresh; refresh-on-401 retry | Engineering | Mitigated |
| R-07 | Webhook delivery gaps | Technical | Low | Medium | 6-hour cron catch-up sync | Engineering | Mitigated |
| R-08 | GH custom field limit exceeded (12 fields) | Technical | Low | Medium | Verify in sandbox; prioritize 6 core fields for V1 | Engineering | Open |
| R-09 | AI summary quality too generic for reviewers | Product | Medium | Low | Structured fallback always available; AI is nice-to-have in V1 | Product | Mitigated |
| R-10 | Scope creep into V2 features | Product | High | High | Scope guard doc; ADR-008; PR review against MVP list | Product | Mitigated |
| R-11 | Existing WorkVouch features broken by integration | Technical | Low | High | Additive-only rule; regression test suite; no existing file edits | Engineering | Mitigated |
| R-12 | Insufficient beta customer feedback | Business | Medium | Medium | Recruit 5 beta targets; structured feedback schedule | CS | Open |
| R-13 | Support team unprepared for integration tickets | Support | Medium | Medium | Troubleshooting guide + runbook before launch | Ops | Open |
| R-14 | Security vulnerability in webhook endpoint | Security | Low | Critical | HMAC verification; no session auth; pen test before launch | Engineering | Open |
| R-15 | Competitor launches similar GH integration first | Business | Low | Medium | Speed to marketplace; unique trust score angle | Product | Accepted |
| R-16 | GH changes Harvest API or webhook format | Dependencies | Low | High | Adapter pattern isolates changes; contract tests catch breaks | Engineering | Mitigated |
| R-17 | Encryption key compromise | Security | Low | Critical | Env var rotation procedure; KMS in V2 | Engineering | Accepted |
| R-18 | Low auto-link rate (<50%) frustrates customers | Product | Medium | Medium | Manual link UX is polished; auto-link is accelerator not requirement | Product | Mitigated |
| R-19 | Demo environment unreliable during review | Marketplace | Medium | High | Pre-seeded data; no live GH dependency; cache all AI summaries | Engineering | Open |
| R-20 | Engineering timeline slip (6 weeks → 10 weeks) | Business | Medium | Medium | MVP scope locked; cut nice-to-haves first; 2 engineers dedicated | Engineering | Open |

---

## Risk Detail

### R-01: GH OAuth Sandbox Credentials Delayed

**Impact if realized:** Blocks T-003 (Greenhouse OAuth adapter). Entire critical path stalls.

**Mitigation:**
1. Register GH developer app on Day 1 of Sprint 3
2. Develop against MockAtsAdapter in parallel
3. Swap to real adapter when credentials arrive (adapter interface is identical)

**Escalation:** If not resolved in 3 business days, escalate to GH partnership contact.

---

### R-02: GH Panel Embedding Restrictions

**Impact if realized:** Recruiter cannot see trust data inside GH. Core value prop broken.

**Mitigation:**
1. 4-hour engineering spike on Day 1 to test Partner Sidebar Extension API
2. Fallback A: Custom field iframe (GH documented approach)
3. Fallback B: "Open in WorkVouch" external link + trust score in GH custom field column

**Decision:** Locked in ADR — Partner Sidebar Extension primary; iframe fallback.

---

### R-10: Scope Creep

**Impact if realized:** MVP never ships; V2 features delay V1 by months.

**Mitigation:**
1. [06-scope-guard.md](./06-scope-guard.md) lists forbidden MVP additions
2. ADR-008 documents intentional scope limitation
3. Every PR checked against MVP feature list
4. Nice-to-have features explicitly cut if timeline slips

---

### R-14: Webhook Security Vulnerability

**Impact if realized:** Forged webhooks could link wrong candidates or trigger invitations.

**Mitigation:**
1. HMAC-SHA256 with timing-safe compare (mandatory)
2. Idempotency key dedup
3. Connection resolution validates org ID
4. Penetration test before marketplace submission
5. Return 401 on invalid signature (never process)

---

## Risk Heatmap

```
Impact →
         Low      Medium     High      Critical
Likelihood
High     R-10     R-20       —         —
Medium   R-09     R-04,R-05  R-01,R-02 R-14
         R-18     R-12,R-13  R-03,R-19 —
Low      R-15     R-06,R-07  R-08,R-16 R-17
                  R-11       —
```

---

## Review Schedule

| When | Action |
|------|--------|
| Sprint 3 kickoff | Review all Open risks |
| Weekly standup | Update status on Open risks |
| Pre-beta | Review Medium+ impact risks |
| Pre-marketplace | All Critical/High risks must be Mitigated or Accepted |
| Post-launch (30 days) | Full risk register review |

---

## Related Documents

- [06-scope-guard.md](./06-scope-guard.md)
- [10-final-go-no-go.md](./10-final-go-no-go.md)
- [docs/decisions/ADR-008-why-mvp-scope-is-intentionally-limited.md](../decisions/ADR-008-why-mvp-scope-is-intentionally-limited.md)
