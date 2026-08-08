# 07 — Custom Fields

> **Sprint:** Operation Greenhouse — Sprint 2.75 (Integration Contracts)  
> **Last updated:** 2026-08-07  
> **Status:** Design specification — no implementation

---

## Overview

WorkVouch publishes candidate trust data to Greenhouse via **custom fields** on the candidate object. Custom fields are created during initial connection (with employer approval) and updated via Harvest API `PATCH /v1/candidates/{id}`.

**Hard rules:**
- Never export vouch text, reference names, or verifier identity
- Never export location beyond country/state
- All fields are outbound (WV → GH) except none are inbound

---

## Custom Field Catalog

### 1. workvouch_trust_score

| Attribute | Value |
|-----------|-------|
| **Display Name** | WorkVouch Trust Score |
| **Name Key** | `workvouch_trust_score` |
| **Type** | `number` |
| **Length** | 0–100 (integer) |
| **Display** | Candidate profile + list view column |
| **Visibility** | All GH users with candidate access |
| **Refresh** | On score change; every 15 min (cron) |
| **Permissions** | Read: all; Write: WorkVouch API only |
| **Fallback** | Empty if no score or below threshold |

---

### 2. workvouch_trust_band

| Attribute | Value |
|-----------|-------|
| **Display Name** | WorkVouch Trust Band |
| **Name Key** | `workvouch_trust_band` |
| **Type** | `single_select` |
| **Options** | `Low`, `Moderate`, `Strong`, `Exceptional`, `Profile building` |
| **Length** | Enum |
| **Display** | Candidate profile + list view column |
| **Visibility** | All GH users |
| **Refresh** | With trust score |
| **Permissions** | Read: all; Write: WorkVouch API only |
| **Fallback** | `Profile building` if below threshold; empty if not linked |

---

### 3. workvouch_verification_status

| Attribute | Value |
|-----------|-------|
| **Display Name** | WorkVouch Verification |
| **Name Key** | `workvouch_verification_status` |
| **Type** | `single_select` |
| **Options** | `none`, `pending`, `verified`, `needs_review`, `disputed` |
| **Display** | Candidate profile |
| **Visibility** | All GH users |
| **Refresh** | On verification status change; every 30 min (cron) |
| **Permissions** | Read: all; Write: WorkVouch API only |
| **Fallback** | `none` |

---

### 4. workvouch_verification_count

| Attribute | Value |
|-----------|-------|
| **Display Name** | WorkVouch Verified Employments |
| **Name Key** | `workvouch_verification_count` |
| **Type** | `number` |
| **Length** | 0–99 |
| **Display** | Candidate profile |
| **Visibility** | All GH users |
| **Refresh** | With verification export |
| **Permissions** | Read: all; Write: WorkVouch API only |
| **Fallback** | `0` |

---

### 5. workvouch_vouch_count

| Attribute | Value |
|-----------|-------|
| **Display Name** | WorkVouch Vouches |
| **Name Key** | `workvouch_vouch_count` |
| **Type** | `number` |
| **Length** | 0–999 |
| **Display** | Candidate profile |
| **Visibility** | All GH users |
| **Refresh** | With trust export |
| **Permissions** | Read: all; Write: WorkVouch API only |
| **Fallback** | `0` |

---

### 6. workvouch_manager_vouch_count

| Attribute | Value |
|-----------|-------|
| **Display Name** | WorkVouch Manager Vouches |
| **Name Key** | `workvouch_manager_vouch_count` |
| **Type** | `number` |
| **Length** | 0–99 |
| **Display** | Candidate profile |
| **Visibility** | All GH users |
| **Refresh** | With trust export (Sprint 4+) |
| **Permissions** | Read: all; Write: WorkVouch API only |
| **Fallback** | `0` |

---

### 7. workvouch_coworker_vouch_count

| Attribute | Value |
|-----------|-------|
| **Display Name** | WorkVouch Coworker Vouches |
| **Name Key** | `workvouch_coworker_vouch_count` |
| **Type** | `number` |
| **Length** | 0–999 |
| **Display** | Candidate profile |
| **Visibility** | All GH users |
| **Refresh** | With trust export (Sprint 4+) |
| **Permissions** | Read: all; Write: WorkVouch API only |
| **Fallback** | `0` |

---

### 8. workvouch_ai_summary

| Attribute | Value |
|-----------|-------|
| **Display Name** | WorkVouch AI Summary |
| **Name Key** | `workvouch_ai_summary` |
| **Type** | `long_text` |
| **Length** | Max 255 chars (truncated at word boundary) |
| **Display** | Candidate profile |
| **Visibility** | All GH users |
| **Refresh** | On AI regeneration; with trust export if AI enabled |
| **Permissions** | Read: all; Write: WorkVouch API only |
| **Fallback** | `"{score} {band} · {n} vouches · {n} verified employments"` |

---

### 9. workvouch_reference_completion_pct

| Attribute | Value |
|-----------|-------|
| **Display Name** | WorkVouch Reference Completion |
| **Name Key** | `workvouch_reference_completion_pct` |
| **Type** | `number` |
| **Length** | 0–100 (integer, percentage) |
| **Display** | Candidate profile |
| **Visibility** | All GH users |
| **Refresh** | On vouch submission (Sprint 5+) |
| **Permissions** | Read: all; Write: WorkVouch API only |
| **Fallback** | Empty if no requests sent |

---

### 10. workvouch_would_rehire_pct

| Attribute | Value |
|-----------|-------|
| **Display Name** | WorkVouch Would Rehire |
| **Name Key** | `workvouch_would_rehire_pct` |
| **Type** | `number` |
| **Length** | 0–100 (integer, percentage) |
| **Display** | Candidate profile |
| **Visibility** | All GH users |
| **Refresh** | On vouch submission (Sprint 5+) |
| **Permissions** | Read: all; Write: WorkVouch API only |
| **Fallback** | Empty if <1 manager vouch with response |

---

### 11. workvouch_profile_url

| Attribute | Value |
|-----------|-------|
| **Display Name** | WorkVouch Profile |
| **Name Key** | `workvouch_profile_url` |
| **Type** | `url` |
| **Length** | Max 500 chars |
| **Display** | Candidate profile (clickable link) |
| **Visibility** | All GH users |
| **Refresh** | On link + trust export |
| **Permissions** | Read: all; Write: WorkVouch API only |
| **Fallback** | Empty if no profile |

---

### 12. workvouch_last_synced_at

| Attribute | Value |
|-----------|-------|
| **Display Name** | WorkVouch Last Synced |
| **Name Key** | `workvouch_last_synced_at` |
| **Type** | `date` |
| **Length** | ISO 8601 |
| **Display** | Candidate profile |
| **Visibility** | All GH users |
| **Refresh** | Every export |
| **Permissions** | Read: all; Write: WorkVouch API only |
| **Fallback** | Empty if never synced |

---

## Field Creation Flow

During initial OAuth connect:

```
1. OAuth completes successfully
2. WorkVouch calls GET /v1/custom_fields?field_type=candidate
3. For each required field:
   a. If name_key exists → use existing field ID
   b. If not → POST /v1/custom_fields (with employer approval modal)
4. Store field IDs in ats_connections.metadata.custom_field_ids
5. Present field mapping UI in settings (see 10-settings-and-automation)
```

**Employer approval modal:**
```
WorkVouch will create the following custom fields in Greenhouse:
☑ Trust Score (number)
☑ Trust Band (dropdown)
☑ Verification Status (dropdown)
☑ ... (12 fields total)

[Approve and create fields]  [Skip — I'll create manually]
```

---

## Refresh Rules

| Event | Fields Updated |
|-------|---------------|
| Trust score change | score, band, vouch_count, last_synced_at |
| Verification complete | verification_status, verification_count, last_synced_at |
| Vouch submitted | vouch_count, manager/coworker counts, reference_completion_pct, would_rehire_pct |
| AI summary regenerated | ai_summary, last_synced_at |
| Manual export | All enabled fields |
| Cron trust export (15 min) | All fields for changed scores |
| Cron verification export (30 min) | Verification fields for changed statuses |
| Initial connect catch-up | All fields for all linked candidates |

---

## Sprint Delivery Matrix

| Field | Sprint 3 | Sprint 4 | Sprint 5 |
|-------|----------|----------|----------|
| trust_score | ✅ | | |
| trust_band | ✅ | | |
| verification_status | | ✅ | |
| verification_count | | ✅ | |
| vouch_count | ✅ | | |
| manager_vouch_count | | ✅ | |
| coworker_vouch_count | | ✅ | |
| ai_summary | | ✅ | |
| reference_completion_pct | | | ✅ |
| would_rehire_pct | | | ✅ |
| profile_url | ✅ | | |
| last_synced_at | ✅ | | |

---

## Permissions Model

| Actor | Can Read | Can Write | Can Create Fields |
|-------|----------|-----------|-------------------|
| GH Recruiter | ✅ All fields | ❌ | ❌ |
| GH Admin | ✅ All fields | ❌ (manual edit possible but overwritten) | ❌ |
| WorkVouch API | ✅ | ✅ | ✅ (on connect) |
| WV Employer Admin | ✅ (via panel) | ❌ (via export only) | ✅ (approve on connect) |

**Note:** If a GH admin manually edits a WorkVouch custom field, the next sync will overwrite it (WV wins).

---

## Related Documents

- [02-field-mapping.md](./02-field-mapping.md)
- [06-sync-contract.md](./06-sync-contract.md)
- [08-automation-rules.md](./08-automation-rules.md)
