# 06 — Scope Guard

> **Sprint:** Operation Greenhouse — Sprint 2.9 (MVP Lock)  
> **Last updated:** 2026-08-07  
> **Authority:** This document blocks feature additions to V1. Override requires ADR.

---

## Purpose

Engineers, designers, and stakeholders will request features during V1 development. This document explains why each deferred feature is **not in MVP** and where it belongs.

**Rule:** If a feature is listed here, the answer to "Can we add this to V1?" is **No** — unless an ADR is written and approved.

---

## Forbidden V1 Features

### Predictive Hiring Insights

**Request:** "Show recruiters which candidates are likely to succeed based on trust patterns."

**Why not V1:** Requires historical hiring outcome data at scale. WorkVouch has insufficient data volume. AI inference without data produces generic output that damages credibility.

**Version:** V3  
**Alternative for V1:** Static AI summary based on verified data only.

---

### Advanced Analytics Dashboard

**Request:** "Show employers pipeline trust overview, avg scores, trends over time."

**Why not V1:** Analytics requires stable sync data over weeks/months. V1 customers won't have enough history at launch. Building analytics before product-market fit is premature optimization.

**Version:** V3  
**Alternative for V1:** Integration health dashboard (sync count, success rate, last sync time).

---

### Fraud Network Detection

**Request:** "Detect coordinated fake vouches across candidates."

**Why not V1:** Requires cross-candidate analysis, graph algorithms, and significant data volume. Existing fraud risk score covers individual candidate flags.

**Version:** V3  
**Alternative for V1:** Individual fraud alerts (date overlap, velocity) in panel — V2.

---

### Multi-ATS Dashboard

**Request:** "Show all connected ATS providers in one view."

**Why not V1:** Only one provider (Greenhouse) exists. Multi-ATS UI with one provider is empty scaffolding.

**Version:** V3 (after Provider #2 ships in V2)  
**Alternative for V1:** Single Greenhouse connection dashboard.

---

### Advanced AI (Predictive, Generative, Coaching)

**Request:** "AI coaching for candidates, AI-generated interview questions, AI hiring recommendations."

**Why not V1:** Scope explosion. AI summary (3 sentences from verified data) is sufficient for recruiter evaluation. Additional AI features require separate model tuning and privacy review.

**Version:** V2 (summary) / V3 (predictive)  
**Alternative for V1:** Structured fallback if AI unavailable.

---

### Workflow Builder

**Request:** "Let employers create custom automation rules with drag-and-drop."

**Why not V1:** Standard automation preset (auto-invite at Final Interview) covers 80% case. Custom rules require a rules engine, UI builder, and testing matrix explosion.

**Version:** V3  
**Alternative for V1:** Standard preset hardcoded; toggle on/off.

---

### Bulk Automation

**Request:** "Batch invite all candidates in a stage" or "Batch export all trust scores."

**Why not V1:** Cron-based batch export already handles trust scores. Manual batch invite is a recruiter workflow GH already supports. Bulk operations add UX complexity and error handling surface.

**Version:** V3  
**Alternative for V1:** Auto-invite on stage change (one at a time via webhook).

---

### Enterprise Reporting

**Request:** "CSV export of all integration activity for compliance audits."

**Why not V1:** No enterprise customers yet. Audit logs exist in `ats_sync_log` for ops debugging. Compliance export requires legal review of data fields.

**Version:** V3  
**Alternative for V1:** Event log visible in employer health dashboard.

---

### Auto-Create WorkVouch Profiles from GH

**Request:** "When a candidate applies in GH, automatically create their WorkVouch profile."

**Why not V1:** Creates profiles without candidate consent. Violates privacy principle ("candidates control their profiles"). Invitation flow ensures consent.

**Version:** V2 (with explicit employer opt-in toggle)  
**Alternative for V1:** Auto-invite email at Final Interview stage.

---

### Bidirectional Saved Candidate Sync

**Request:** "When recruiter saves a candidate in GH, auto-save in WorkVouch and vice versa."

**Why not V1:** Dedup logic is complex (same person, different emails, merged candidates). Low ATS value compared to trust score export.

**Version:** V3  
**Alternative for V1:** Manual link by email.

---

### Vouch Text Export to Greenhouse

**Request:** "Export vouch comments to GH notes so recruiters can read them."

**Why not V1:** **Never.** Privacy policy prohibits exporting reference provider content to third-party systems without explicit reference consent. Aggregate counts only.

**Version:** Never  
**Alternative for V1:** Vouch count + would rehire signal in panel.

---

### Lever / Ashby / Any Non-Greenhouse Provider

**Request:** "Can we add Lever support in V1 since the adapter pattern supports it?"

**Why not V1:** Each provider requires OAuth app registration, sandbox testing, webhook format adaptation, custom field mapping, and marketplace listing. One provider done well beats two done poorly.

**Version:** V2 (Lever)  
**Alternative for V1:** MockAtsAdapter proves multi-provider architecture in tests.

---

### Job Sync Service

**Request:** "Sync all GH jobs so employers can filter auto-invite by job title."

**Why not V1:** Webhook payload includes job ID on application events. Job filter can use IDs from webhook without full job sync. Full job sync adds cron complexity.

**Version:** V2  
**Alternative for V1:** Auto-invite applies to all jobs (no filter) or manual job ID list from initial connect.

---

### KMS Token Encryption

**Request:** "Use AWS KMS for token encryption instead of environment variable."

**Why not V1:** Launch volume (<100 connections) does not justify KMS complexity. Env var with rotation procedure is sufficient. KMS adds infrastructure dependency and latency.

**Version:** V2  
**Alternative for V1:** `ATS_ENCRYPTION_KEY` env var (32 bytes, base64).

---

### Side-by-Side Candidate Comparison

**Request:** "Compare trust scores of two candidates side by side in GH."

**Why not V1:** GH panel is 320px sidebar — insufficient width for comparison. Trust scores in GH list view column provide comparison at list level.

**Version:** V2  
**Alternative for V1:** Trust score column in GH candidate list.

---

## Scope Guard Enforcement

| Checkpoint | Enforcer | Action |
|------------|----------|--------|
| PR review | Engineering lead | Reject PRs adding forbidden features |
| Sprint planning | Product | Features not on V1 list require ADR |
| Design review | Design | Wireframes checked against MVP definition |
| QA | QA | Test scope matches MVP acceptance tests only |
| Marketplace submission | Product | Only V1 features referenced in listing |

---

## How to Request a Scope Change

1. Write an ADR explaining why the feature is needed in V1
2. Identify what V1 feature is deprioritized to make room
3. Product + Engineering lead approve
4. Update [01-mvp-definition.md](./01-mvp-definition.md) and this document

**Default answer:** "That's V2. See [02-v1-v2-v3-roadmap.md](./02-v1-v2-v3-roadmap.md)."

---

## Related Documents

- [01-mvp-definition.md](./01-mvp-definition.md)
- [02-v1-v2-v3-roadmap.md](./02-v1-v2-v3-roadmap.md)
- [docs/decisions/ADR-008-why-mvp-scope-is-intentionally-limited.md](../decisions/ADR-008-why-mvp-scope-is-intentionally-limited.md)
