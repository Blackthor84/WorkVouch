# 02 — V1 / V2 / V3 Roadmap

> **Sprint:** Operation Greenhouse — Sprint 2.9 (MVP Lock)  
> **Last updated:** 2026-08-07  
> **Rule:** Every feature appears exactly once. No duplicates.

---

## Version 1 — Greenhouse MVP (Ship to Marketplace)

**Timeline:** ~6 weeks (2 engineers)  
**Goal:** Impress GH reviewers; deliver trust scores in Greenhouse

### Integration Platform
- `ats_*` database tables (8 tables)
- `AtsProvider` interface + `MockAtsAdapter`
- `GreenhouseAdapter` (OAuth, webhooks, sync, custom fields)
- Event bus + worker + retry + DLQ
- `/api/integrations/v1/` API routes (15 endpoints)
- Provider registry (Greenhouse + Mock only)
- Cron jobs (events, trust export, token refresh, DLQ retry, health check)

### Greenhouse Features
- OAuth 2.0 + PKCE connect/disconnect
- Webhook handler (9 events: candidate, application, hire, reject, offer)
- Email auto-link + manual link/unlink
- Trust score export (6 custom fields)
- Trust band export
- Vouch count + verification count export
- Profile URL export
- Last synced timestamp export
- Auto-invite at Final Interview (Standard preset)
- Send reminder from panel

### UI
- Employer integration settings page
- Integration health dashboard
- Greenhouse embedded panel (iframe/sidebar)
- Panel states: loading, linked, not linked, stale, error, insufficient data
- Connect/disconnect flow with confirmation modal
- Demo environment (NovaTech Industries)

### Reliability & Security
- Token encryption (AES-256-GCM, env var key)
- Webhook HMAC-SHA256
- RLS tenant isolation
- Stale badge + cached panel fallback
- Sync/webhook audit logs
- Contract test suite

### Documentation & Marketplace
- Installation guide
- 6 marketplace screenshots
- 90-second demo video
- Error documentation
- Support email

---

## Version 2 — Growth & Second Provider (Post-Marketplace)

**Timeline:** ~8 weeks after V1 launch  
**Goal:** Deepen GH integration; prove multi-provider architecture

### Greenhouse Enhancements
- Verification status export to GH custom field
- AI summary in panel (with structured fallback)
- AI summary export to GH custom field (truncated)
- Manager vouch count + coworker vouch count export
- Reference completion % + would rehire % export
- Custom field auto-creation on connect
- Automation presets UI (Conservative, Standard, Aggressive, Post-offer)
- Job filter for auto-invite (selected jobs dropdown)
- Location filter for auto-invite (country/state)
- Trust score threshold setting
- Weekly digest email to admin
- Verification export with optional GH activity note
- Candidate deleted in GH handling (external_deleted state)
- Stage name mapping configuration
- Side-by-side trust comparison in GH list view
- KMS token encryption migration
- Auto-profile creation toggle (employer opt-in)

### Platform
- Job sync service (inbound from GH)
- Advanced export fields (4 additional custom fields)
- Employer notification integration (7 notification types)
- Panel JWT auth hardening
- Load testing + performance optimization
- Worker horizontal scaling spec

### Provider #2: Lever
- Lever adapter implementing `AtsProvider`
- Lever OAuth flow
- Lever webhook handler
- Lever custom field export
- Lever manifest entry
- Lever sandbox E2E tests

### Beta Expansion
- 10+ production customers
- Customer success playbook
- Integration analytics dashboard (basic)

---

## Version 3 — Platform & Enterprise (Scale)

**Timeline:** ~12 weeks after V2  
**Goal:** ATS integration platform; enterprise features

### Providers
- Ashby adapter
- SmartRecruiters adapter
- Provider #2–4 in marketplace listings

### Enterprise Features
- Multi-ATS dashboard (view all connected providers)
- Enterprise reporting (pipeline trust overview, avg scores)
- Compliance export (integration activity log CSV)
- WorkVouch internal admin dashboard (`/admin/integrations`)
- Operational runbooks + escalation tiers
- Team permissions (Hiring Manager read-only health)
- Saved candidate bidirectional sync
- Hiring outcome feedback loop (post-hire)

### Advanced Product
- Predictive hiring insights ("candidates like X succeed in this role")
- Fraud detection alerts in panel (overlap, velocity)
- Risk heatmap on employer dashboard
- Workflow builder (custom automation rules)
- Bulk automation (batch invite, batch export)
- GH custom field mapping UI
- SMS reminders for candidates (Twilio integration)

### Infrastructure
- KMS for all secrets
- Multi-region deployment consideration
- 99.99% uptime SLA
- Public status page
- SOC2 Type II audit preparation

---

## Feature Placement Matrix

| Feature | V1 | V2 | V3 |
|---------|:--:|:--:|:--:|
| OAuth connect (GH) | ✅ | | |
| Webhooks (GH) | ✅ | | |
| Email auto-link | ✅ | | |
| Manual link | ✅ | | |
| Trust score export | ✅ | | |
| GH embedded panel | ✅ | | |
| Health dashboard | ✅ | | |
| Auto-invite (Final Interview) | ✅ | | |
| Demo environment | ✅ | | |
| Verification export to GH | | ✅ | |
| AI summary (panel) | | ✅ | |
| AI summary (GH field) | | ✅ | |
| Automation presets UI | | ✅ | |
| Job/location filters | | ✅ | |
| Advanced export fields (6) | | ✅ | |
| Lever provider | | ✅ | |
| Job sync | | ✅ | |
| KMS encryption | | ✅ | |
| Auto-profile creation | | ✅ | |
| Side-by-side comparison | | ✅ | |
| Ashby / SmartRecruiters | | | ✅ |
| Multi-ATS dashboard | | | ✅ |
| Enterprise reporting | | | ✅ |
| Predictive insights | | | ✅ |
| Fraud network | | | ✅ |
| Workflow builder | | | ✅ |
| Bulk automation | | | ✅ |
| Saved candidate sync | | | ✅ |
| Internal admin dashboard | | | ✅ |
| SOC2 Type II | | | ✅ |

---

## Related Documents

- [01-mvp-definition.md](./01-mvp-definition.md)
- [06-scope-guard.md](./06-scope-guard.md)
- [09-post-launch-roadmap.md](./09-post-launch-roadmap.md)
- [docs/integration-contract/14-implementation-checklist.md](../integration-contract/14-implementation-checklist.md)
