# 14 — Implementation Checklist

> **Sprint:** Operation Greenhouse — Sprint 2.75 (Integration Contracts)  
> **Last updated:** 2026-08-07  
> **Status:** Design specification — no implementation

---

## Sprint 3 Tasks (Foundation)

### T-001: Database Migrations

| Attribute | Value |
|-----------|-------|
| **Objective** | Create all `ats_*` tables per 08-database-design.md |
| **Dependencies** | None |
| **Estimated Hours** | 8 |
| **Risk** | Low — additive tables only |
| **Rollback** | Drop tables migration |
| **Definition of Done** | All 7 tables created with indexes, RLS policies, and enums |
| **Testing** | Migration up/down; RLS isolation test |

Tables: `ats_connections`, `ats_provider_accounts`, `ats_candidate_map`, `ats_job_map`, `ats_events`, `ats_sync_log`, `ats_webhook_log`, `ats_oauth_states`

---

### T-002: Provider Interface + Mock Adapter

| Attribute | Value |
|-----------|-------|
| **Objective** | Implement `AtsProvider` interface and `MockAtsAdapter` |
| **Dependencies** | T-001 |
| **Estimated Hours** | 12 |
| **Risk** | Low |
| **Rollback** | Delete provider files |
| **Definition of Done** | All interface methods implemented; contract test suite passes |
| **Testing** | U-001 through U-015; C-007 |

---

### T-003: Greenhouse Adapter — OAuth

| Attribute | Value |
|-----------|-------|
| **Objective** | Implement `connect()`, `disconnect()`, `refreshToken()`, `healthCheck()` |
| **Dependencies** | T-002, GH sandbox credentials |
| **Estimated Hours** | 16 |
| **Risk** | Medium — requires GH OAuth app registration |
| **Rollback** | Revert adapter; connection records manually cleaned |
| **Definition of Done** | Full OAuth flow works in GH sandbox; tokens encrypted |
| **Testing** | O-001 through O-008; I-001, I-002 |

---

### T-004: Greenhouse Adapter — Webhooks

| Attribute | Value |
|-----------|-------|
| **Objective** | Implement `verifyWebhook()`, `parseWebhookEvent()`, webhook endpoint |
| **Dependencies** | T-003 |
| **Estimated Hours** | 12 |
| **Risk** | Medium — webhook registration via GH API |
| **Rollback** | Disable webhook endpoint |
| **Definition of Done** | All 9 webhook events parsed; 200 returned <500ms |
| **Testing** | W-001 through W-011; I-003, I-004 |

---

### T-005: Event Bus + Worker

| Attribute | Value |
|-----------|-------|
| **Objective** | Implement event queue, worker, retry, and DLQ |
| **Dependencies** | T-001, T-004 |
| **Estimated Hours** | 16 |
| **Risk** | Medium — async processing complexity |
| **Rollback** | Disable cron workers |
| **Definition of Done** | Events processed async; retry with backoff; DLQ after 5 attempts |
| **Testing** | I-003, I-012; F-004 |

---

### T-006: Candidate Sync Service

| Attribute | Value |
|-----------|-------|
| **Objective** | Inbound candidate sync with email auto-link |
| **Dependencies** | T-004, T-005 |
| **Estimated Hours** | 12 |
| **Risk** | Medium — email matching edge cases |
| **Rollback** | Disable candidate sync cron |
| **Definition of Done** | Auto-link, pending, ambiguous states work; U-020 through U-022 pass |
| **Testing** | I-003, I-007, I-008; S-001 |

---

### T-007: Trust Export Service

| Attribute | Value |
|-----------|-------|
| **Objective** | Outbound trust score export to GH custom fields |
| **Dependencies** | T-003, T-006 |
| **Estimated Hours** | 12 |
| **Risk** | Low |
| **Rollback** | Disable trust export cron |
| **Definition of Done** | 6 custom fields exported; threshold logic works |
| **Testing** | I-005; S-002; C-011 |

---

### T-008: Integration API Routes

| Attribute | Value |
|-----------|-------|
| **Objective** | Implement all `/api/integrations/v1/` endpoints |
| **Dependencies** | T-003 through T-007 |
| **Estimated Hours** | 20 |
| **Risk** | Low — follows 05-api-contract.md |
| **Rollback** | Remove route files |
| **Definition of Done** | All 15 endpoints functional; error format consistent |
| **Testing** | C-001 through C-006; I-001 through I-015 |

---

### T-009: Employer Settings UI

| Attribute | Value |
|-----------|-------|
| **Objective** | Connect/disconnect, automation settings, health dashboard |
| **Dependencies** | T-008 |
| **Estimated Hours** | 16 |
| **Risk** | Low |
| **Rollback** | Hide integrations section |
| **Definition of Done** | Full employer journey from 03-employer-experience.md |
| **Testing** | UI-001 through UI-004, UI-010 |

---

### T-010: Greenhouse Panel (Iframe)

| Attribute | Value |
|-----------|-------|
| **Objective** | Embedded panel API + iframe UI for GH sidebar |
| **Dependencies** | T-007, T-008 |
| **Estimated Hours** | 20 |
| **Risk** | Medium — GH iframe integration method TBD |
| **Rollback** | Panel returns 404 |
| **Definition of Done** | Panel loads <3s; all states from 06-workvouch-panel.md |
| **Testing** | UI-005 through UI-009; I-014; A-002 |

---

## Sprint 4 Tasks (Enhancement)

### T-011: Verification Export Service

| Attribute | Value |
|-----------|-------|
| **Objective** | Export verification status + count to GH |
| **Dependencies** | T-007 |
| **Estimated Hours** | 8 |
| **Risk** | Low |
| **Rollback** | Disable verification export |
| **Definition of Done** | Verification custom fields exported; optional note |
| **Testing** | I-006; S-003 |

---

### T-012: Automation Engine

| Attribute | Value |
|-----------|-------|
| **Objective** | Auto-invite, job/location filters, presets |
| **Dependencies** | T-005, T-006 |
| **Estimated Hours** | 16 |
| **Risk** | Medium — rule evaluation complexity |
| **Rollback** | Disable auto-invite globally |
| **Definition of Done** | All 15 rules from 08-automation-rules.md |
| **Testing** | U-040 through U-048; I-009 |

---

### T-013: AI Summary Export

| Attribute | Value |
|-----------|-------|
| **Objective** | AI summary in panel + GH custom field |
| **Dependencies** | T-010 |
| **Estimated Hours** | 12 |
| **Risk** | Medium — AI quality |
| **Rollback** | Disable AI; show structured fallback |
| **Definition of Done** | Summary generated <5s; fallback works |
| **Testing** | F-006; A-003 |

---

### T-014: Notification Integration

| Attribute | Value |
|-----------|-------|
| **Objective** | Employer notifications for sync events |
| **Dependencies** | T-005, T-007 |
| **Estimated Hours** | 8 |
| **Risk** | Low |
| **Rollback** | Disable notification triggers |
| **Definition of Done** | 7 notification types from 08-notification-system.md |
| **Testing** | I-005, I-009 |

---

### T-015: Custom Field Auto-Creation

| Attribute | Value |
|-----------|-------|
| **Objective** | Create 12 GH custom fields on connect |
| **Dependencies** | T-003 |
| **Estimated Hours** | 8 |
| **Risk** | Medium — GH API field creation |
| **Rollback** | Manual field creation fallback |
| **Definition of Done** | All 12 fields from 07-custom-fields.md created |
| **Testing** | C-011; A-006 |

---

## Sprint 5 Tasks (Polish)

### T-016: Job Sync Service

| Attribute | Value |
|-----------|-------|
| **Objective** | Inbound job sync for automation filters |
| **Dependencies** | T-006 |
| **Estimated Hours** | 8 |
| **Risk** | Low |
| **Rollback** | Disable job sync |
| **Definition of Done** | Jobs synced; location normalized |
| **Testing** | U-030; S-001 |

---

### T-017: Advanced Export Fields

| Attribute | Value |
|-----------|-------|
| **Objective** | Manager/coworker counts, reference completion %, would rehire % |
| **Dependencies** | T-007 |
| **Estimated Hours** | 8 |
| **Risk** | Low |
| **Rollback** | Disable advanced fields |
| **Definition of Done** | 4 additional custom fields exported |
| **Testing** | C-011 |

---

### T-018: Demo Environment

| Attribute | Value |
|-----------|-------|
| **Objective** | NovaTech demo with pre-seeded data |
| **Dependencies** | T-010, T-013 |
| **Estimated Hours** | 16 |
| **Risk** | Low |
| **Rollback** | Disable demo route |
| **Definition of Done** | Demo completable in <5 min; 4 candidate states |
| **Testing** | A-001 through A-008 |

---

### T-019: Load Testing

| Attribute | Value |
|-----------|-------|
| **Objective** | Validate performance targets |
| **Dependencies** | All Sprint 3–4 tasks |
| **Estimated Hours** | 8 |
| **Risk** | Medium — may reveal bottlenecks |
| **Rollback** | N/A |
| **Definition of Done** | All L-001 through L-005 targets met |
| **Testing** | L-001 through L-005 |

---

### T-020: Marketplace Submission

| Attribute | Value |
|-----------|-------|
| **Objective** | Submit to Greenhouse Marketplace |
| **Dependencies** | T-018, all checklist items from 12-marketplace-readiness.md |
| **Estimated Hours** | 8 |
| **Risk** | Medium — reviewer feedback |
| **Rollback** | N/A |
| **Definition of Done** | Listing submitted; reviewer assigned |
| **Testing** | Full acceptance suite (A-001 through A-008) |

---

## Effort Summary

| Sprint | Tasks | Estimated Hours |
|--------|-------|----------------|
| Sprint 3 | T-001 through T-010 | 144 |
| Sprint 4 | T-011 through T-015 | 52 |
| Sprint 5 | T-016 through T-020 | 48 |
| **Total** | **20 tasks** | **244 hours (~6 weeks, 2 engineers)** |

---

## Critical Path

```
T-001 → T-002 → T-003 → T-004 → T-005 → T-006 → T-007 → T-008 → T-010
                                                              ↓
                                                         T-009 (parallel)
                                                              ↓
T-011 → T-012 → T-013 → T-015 → T-018 → T-020
```

**Blockers:**
- T-003 blocked on GH OAuth app credentials
- T-010 blocked on GH iframe/sidebar integration method confirmation
- T-018 blocked on T-010 + T-013

---

## Related Documents

- [11-testing-matrix.md](./11-testing-matrix.md)
- [15-final-engineering-review.md](./15-final-engineering-review.md)
- [docs/integrations/14-implementation-roadmap.md](../integrations/14-implementation-roadmap.md)
