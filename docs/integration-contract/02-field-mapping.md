# 02 — Field Mapping

> **Sprint:** Operation Greenhouse — Sprint 2.75 (Integration Contracts)  
> **Last updated:** 2026-08-07  
> **Status:** Design specification — no implementation

---

## Mapping Conventions

| Symbol | Meaning |
|--------|---------|
| **→** | WorkVouch reads from Greenhouse (inbound) |
| **←** | WorkVouch writes to Greenhouse (outbound) |
| **↔** | Bidirectional (with source-of-truth rule) |
| **GH** | Greenhouse Harvest API / webhook payload |
| **WV** | WorkVouch database / API |

**Confidence levels:**
- **High** — Direct 1:1 mapping, validated in contract tests
- **Medium** — Transformation required, edge cases documented
- **Low** — Optional, provider-dependent, or Sprint 5+ deferral

---

## Candidate Identity Fields

### Candidate Name

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | `first_name`, `last_name` (Harvest API) / `payload.candidate.first_name`, `payload.candidate.last_name` (webhook) |
| **WorkVouch Field** | `ats_candidate_map.candidate_name` (display cache); `profiles.full_name` (post-signup) |
| **Direction** | GH → WV |
| **Owner** | Greenhouse (inbound cache); WorkVouch (profile) |
| **Required** | Yes (GH); No (WV until profile created) |
| **Nullable** | WV: yes until linked |
| **Default** | — |
| **Transformation** | Concatenate: `{first_name} {last_name}`.trim() |
| **Validation** | Max 200 chars; strip control characters |
| **Sync Frequency** | On webhook (`candidate_created`, `candidate_updated`); on manual sync |
| **Conflict Resolution** | GH wins for display cache; WV profile name unchanged post-signup |
| **Fallback** | Display external candidate ID if name missing |
| **Confidence** | High |

---

### Email

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | `email_addresses[].value` (type=`personal` preferred) |
| **WorkVouch Field** | `ats_candidate_map.candidate_email`; `profiles.email` |
| **Direction** | GH → WV (linking); WV → GH (never) |
| **Owner** | Greenhouse (primary for auto-link) |
| **Required** | Yes for auto-link |
| **Nullable** | No for auto-link; manual link allowed without email |
| **Default** | — |
| **Transformation** | Lowercase, trim whitespace |
| **Validation** | RFC 5322 format; reject `+alias` normalization (preserve as-is) |
| **Sync Frequency** | Real-time (webhook); every 6h (cron candidate sync) |
| **Conflict Resolution** | GH email used for linking only; WV profile email unchanged after signup |
| **Fallback** | Manual link if no email or no match |
| **Confidence** | High |

---

### Phone

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | `phone_numbers[].value` |
| **WorkVouch Field** | Not stored in integration tables |
| **Direction** | GH → WV (read-only, not persisted Sprint 3) |
| **Owner** | Greenhouse |
| **Required** | No |
| **Nullable** | Yes |
| **Default** | — |
| **Transformation** | E.164 normalization if persisted (future) |
| **Validation** | — |
| **Sync Frequency** | Not synced Sprint 3 |
| **Conflict Resolution** | N/A |
| **Fallback** | — |
| **Confidence** | Low (deferred) |

---

## Job & Application Fields

### Job Title

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | `jobs[].name` or `applications[].jobs[].name` |
| **WorkVouch Field** | `ats_job_map.job_title`; `ats_candidate_map.metadata.job_title` |
| **Direction** | GH → WV |
| **Owner** | Greenhouse |
| **Required** | No |
| **Nullable** | Yes |
| **Default** | — |
| **Transformation** | Trim, max 500 chars |
| **Validation** | Non-empty if present |
| **Sync Frequency** | Webhook + daily job sync |
| **Conflict Resolution** | GH wins |
| **Fallback** | "Unknown job" in UI |
| **Confidence** | High |

---

### Job ID

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | `jobs[].id` / `applications[].jobs[].id` |
| **WorkVouch Field** | `ats_candidate_map.external_job_id`; `ats_job_map.external_job_id` |
| **Direction** | GH → WV |
| **Owner** | Greenhouse |
| **Required** | Yes (for job-filtered automation) |
| **Nullable** | Yes (candidate may have multiple applications) |
| **Default** | — |
| **Transformation** | String cast of integer ID |
| **Validation** | Numeric string |
| **Sync Frequency** | Real-time (webhook) |
| **Conflict Resolution** | GH wins |
| **Fallback** | Automation runs for all jobs if job ID missing |
| **Confidence** | High |

---

### Application Status

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | `applications[].status`; `applications[].current_stage.name` |
| **WorkVouch Field** | `ats_candidate_map.application_status` |
| **Direction** | GH → WV |
| **Owner** | Greenhouse |
| **Required** | No |
| **Nullable** | Yes |
| **Default** | `unknown` |
| **Transformation** | Map GH stage → canonical `ApplicationStatus` (see [03-status-mapping.md](./03-status-mapping.md)) |
| **Validation** | Must be recognized stage or `unknown` |
| **Sync Frequency** | Real-time (webhook `application_updated`, `hire_candidate`, `reject_candidate`) |
| **Conflict Resolution** | GH always wins |
| **Fallback** | `unknown` |
| **Confidence** | High |

---

### Application ID

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | `applications[].id` |
| **WorkVouch Field** | `ats_candidate_map.external_application_id` |
| **Direction** | GH → WV |
| **Owner** | Greenhouse |
| **Required** | No |
| **Nullable** | Yes |
| **Default** | — |
| **Transformation** | String cast |
| **Validation** | Numeric string |
| **Sync Frequency** | Webhook `application_created`, `application_updated` |
| **Conflict Resolution** | GH wins |
| **Fallback** | — |
| **Confidence** | High |

---

## Trust & Verification Fields (Outbound)

### Trust Score

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | Custom field: `workvouch_trust_score` |
| **WorkVouch Field** | `trust_scores.score` |
| **Direction** | WV ← GH |
| **Owner** | WorkVouch |
| **Required** | No (only exported if ≥ threshold) |
| **Nullable** | Yes (export "Profile building" if below threshold) |
| **Default** | — |
| **Transformation** | Integer 0–100; round to nearest integer |
| **Validation** | 0 ≤ score ≤ 100 |
| **Sync Frequency** | On score change; every 15 min (cron); manual export |
| **Conflict Resolution** | WV always wins — re-export overwrites GH value |
| **Fallback** | Empty custom field if no score |
| **Confidence** | High |

---

### Trust Band

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | Custom field: `workvouch_trust_band` |
| **WorkVouch Field** | `getTrustBandLabel(trust_scores.score)` → Low \| Moderate \| Strong \| Exceptional |
| **Direction** | WV ← GH |
| **Owner** | WorkVouch |
| **Required** | No |
| **Nullable** | Yes |
| **Default** | — |
| **Transformation** | Enum mapping from score ranges (see `lib/trust/trustBandLabels.ts`) |
| **Validation** | Must be one of 4 band labels |
| **Sync Frequency** | Same as trust score |
| **Conflict Resolution** | WV wins |
| **Fallback** | Empty if no score |
| **Confidence** | High |

---

### Verification Status

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | Custom field: `workvouch_verification_status` |
| **WorkVouch Field** | Computed from `verification_requests.status` + `employment_records.verification_status` |
| **Direction** | WV ← GH |
| **Owner** | WorkVouch |
| **Required** | No |
| **Nullable** | Yes |
| **Default** | `none` |
| **Transformation** | Map to: `none` \| `pending` \| `verified` \| `needs_review` \| `disputed` |
| **Validation** | Enum |
| **Sync Frequency** | On verification status change; every 30 min (cron) |
| **Conflict Resolution** | WV wins |
| **Fallback** | `none` |
| **Confidence** | High |

---

### Employment Verified (Count)

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | Custom field: `workvouch_verification_count` |
| **WorkVouch Field** | COUNT(`employment_records` WHERE `verification_status = 'verified'`) |
| **Direction** | WV ← GH |
| **Owner** | WorkVouch |
| **Required** | No |
| **Nullable** | Yes |
| **Default** | `0` |
| **Transformation** | Integer |
| **Validation** | ≥ 0 |
| **Sync Frequency** | With verification export |
| **Conflict Resolution** | WV wins |
| **Fallback** | `0` |
| **Confidence** | High |

---

### Manager References (Count)

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | Custom field: `workvouch_manager_vouch_count` |
| **WorkVouch Field** | COUNT(vouches WHERE relationship = 'manager') |
| **Direction** | WV ← GH |
| **Owner** | WorkVouch |
| **Required** | No |
| **Nullable** | Yes |
| **Default** | `0` |
| **Transformation** | Integer |
| **Validation** | ≥ 0 |
| **Sync Frequency** | With trust export (Sprint 4+) |
| **Conflict Resolution** | WV wins |
| **Fallback** | `0` |
| **Confidence** | Medium |

---

### Coworker References (Count)

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | Custom field: `workvouch_coworker_vouch_count` |
| **WorkVouch Field** | COUNT(vouches WHERE relationship = 'coworker') |
| **Direction** | WV ← GH |
| **Owner** | WorkVouch |
| **Required** | No |
| **Nullable** | Yes |
| **Default** | `0` |
| **Transformation** | Integer |
| **Validation** | ≥ 0 |
| **Sync Frequency** | With trust export (Sprint 4+) |
| **Conflict Resolution** | WV wins |
| **Fallback** | `0` |
| **Confidence** | Medium |

---

### Total Vouch Count

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | Custom field: `workvouch_vouch_count` |
| **WorkVouch Field** | `trust_scores.reference_count` |
| **Direction** | WV ← GH |
| **Owner** | WorkVouch |
| **Required** | No |
| **Nullable** | Yes |
| **Default** | `0` |
| **Transformation** | Integer |
| **Validation** | ≥ 0 |
| **Sync Frequency** | With trust export |
| **Conflict Resolution** | WV wins |
| **Fallback** | `0` |
| **Confidence** | High |

---

### AI Summary

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | Custom field: `workvouch_ai_summary` (max 255 chars) |
| **WorkVouch Field** | AI service output (cached) |
| **Direction** | WV ← GH |
| **Owner** | WorkVouch |
| **Required** | No |
| **Nullable** | Yes |
| **Default** | — |
| **Transformation** | Truncate to 255 chars at word boundary; strip newlines |
| **Validation** | Max 255 chars; no PII beyond candidate first name |
| **Sync Frequency** | On AI regeneration; with trust export if AI enabled |
| **Conflict Resolution** | WV wins |
| **Fallback** | Structured string: "{score} {band} · {n} vouches · {n} verified" |
| **Confidence** | Medium |

---

### Profile URL

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | Custom field: `workvouch_profile_url` |
| **WorkVouch Field** | `https://workvouch.com/v/{profiles.slug}` |
| **Direction** | WV ← GH |
| **Owner** | WorkVouch |
| **Required** | No |
| **Nullable** | Yes (no profile yet) |
| **Default** | — |
| **Transformation** | Absolute HTTPS URL |
| **Validation** | Valid URL; must be workvouch.com domain |
| **Sync Frequency** | On link + trust export |
| **Conflict Resolution** | WV wins |
| **Fallback** | Empty |
| **Confidence** | High |

---

### Last Synced At

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | Custom field: `workvouch_last_synced_at` |
| **WorkVouch Field** | `ats_candidate_map.last_trust_export_at` |
| **Direction** | WV ← GH |
| **Owner** | WorkVouch |
| **Required** | No |
| **Nullable** | Yes |
| **Default** | — |
| **Transformation** | ISO 8601 UTC string |
| **Validation** | Valid datetime |
| **Sync Frequency** | Every export |
| **Conflict Resolution** | WV wins |
| **Fallback** | — |
| **Confidence** | High |

---

### Reference Completion %

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | Custom field: `workvouch_reference_completion_pct` |
| **WorkVouch Field** | Computed: (submitted_vouches / requested_vouches) × 100 |
| **Direction** | WV ← GH |
| **Owner** | WorkVouch |
| **Required** | No |
| **Nullable** | Yes |
| **Default** | — |
| **Transformation** | Integer 0–100 |
| **Validation** | 0 ≤ pct ≤ 100 |
| **Sync Frequency** | On vouch submission (Sprint 5+) |
| **Conflict Resolution** | WV wins |
| **Fallback** | Empty if no requests sent |
| **Confidence** | Medium (Sprint 5+) |

---

### Would Rehire %

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | Custom field: `workvouch_would_rehire_pct` |
| **WorkVouch Field** | Computed: (would_rehire_yes / total_with_response) × 100 |
| **Direction** | WV ← GH |
| **Owner** | WorkVouch |
| **Required** | No |
| **Nullable** | Yes |
| **Default** | — |
| **Transformation** | Integer 0–100 |
| **Validation** | Requires ≥1 manager vouch with would_rehire response |
| **Sync Frequency** | Sprint 5+ |
| **Conflict Resolution** | WV wins |
| **Fallback** | Empty if insufficient data |
| **Confidence** | Medium (Sprint 5+) |

---

## Location Fields

### Job Location (Country/State)

| Attribute | Value |
|-----------|-------|
| **Greenhouse Field** | `jobs[].location.name` (parsed) or custom location fields |
| **WorkVouch Field** | `ats_job_map.location_country`, `ats_job_map.location_state` |
| **Direction** | GH → WV |
| **Owner** | Greenhouse |
| **Required** | No |
| **Nullable** | Yes |
| **Default** | — |
| **Transformation** | Parse GH location string → ISO-2 country; US state code if US |
| **Validation** | If country=US, state required; invalid state → drop record |
| **Sync Frequency** | Job sync |
| **Conflict Resolution** | GH wins |
| **Fallback** | Empty (no location filter applied) |
| **Confidence** | Medium |

**Hard rule:** Never store city, ZIP, lat/lng per WorkVouch location safety policy.

---

## Field Mapping Matrix (Quick Reference)

| WorkVouch Field | GH Field / Custom Field | Direction | Sprint |
|-----------------|------------------------|-----------|--------|
| `candidate_name` | `first_name` + `last_name` | → | 3 |
| `candidate_email` | `email_addresses[].value` | → | 3 |
| `application_status` | `applications[].current_stage.name` | → | 3 |
| `external_job_id` | `jobs[].id` | → | 3 |
| `trust_scores.score` | `workvouch_trust_score` | ← | 3 |
| Trust band | `workvouch_trust_band` | ← | 3 |
| Verification status | `workvouch_verification_status` | ← | 4 |
| Verification count | `workvouch_verification_count` | ← | 4 |
| Vouch count | `workvouch_vouch_count` | ← | 3 |
| Profile URL | `workvouch_profile_url` | ← | 3 |
| Last synced | `workvouch_last_synced_at` | ← | 3 |
| AI summary | `workvouch_ai_summary` | ← | 4 |
| Manager vouch count | `workvouch_manager_vouch_count` | ← | 4 |
| Coworker vouch count | `workvouch_coworker_vouch_count` | ← | 4 |
| Reference completion % | `workvouch_reference_completion_pct` | ← | 5 |
| Would rehire % | `workvouch_would_rehire_pct` | ← | 5 |
| Phone | — | — | Deferred |

---

## Related Documents

- [01-domain-model.md](./01-domain-model.md)
- [03-status-mapping.md](./03-status-mapping.md)
- [07-custom-fields.md](./07-custom-fields.md)
- [docs/integrations/05-sync-engine.md](../integrations/05-sync-engine.md)
