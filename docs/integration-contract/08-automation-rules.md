# 08 — Automation Rules

> **Sprint:** Operation Greenhouse — Sprint 2.75 (Integration Contracts)  
> **Last updated:** 2026-08-07  
> **Status:** Design specification — no implementation

---

## Overview

Automation rules are stored in `ats_connections.sync_preferences` (JSONB). Evaluated by the Event Bus worker on qualifying webhook events and cron cycles.

**Storage schema:**
```json
{
  "automation": {
    "auto_invite_enabled": true,
    "auto_invite_trigger": "final_interview",
    "auto_invite_delay_hours": 0,
    "auto_export_trust": true,
    "auto_export_trigger": "on_score_change",
    "trust_score_threshold": 0,
    "ai_enabled": true,
    "job_filter_mode": "all",
    "job_filter_ids": [],
    "location_filter_mode": "all",
    "location_filter": [],
    "reminder_schedule": {
      "vouch_first_days": 3,
      "vouch_second_days": 7,
      "vouch_final_days": 14,
      "vouch_max_reminders": 3,
      "verify_first_days": 2,
      "verify_second_days": 5,
      "verify_max_reminders": 2
    },
    "expiration": {
      "invitation_days": 30,
      "verification_link_days": 14,
      "vouch_request_days": 21
    }
  }
}
```

---

## Rule 1: Auto-Invite — After Final Interview

| Attribute | Value |
|-----------|-------|
| **Rule ID** | `auto_invite_final_interview` |
| **Trigger** | Webhook `application_updated` where `current_stage.name` matches "Final Interview" (case-insensitive) |
| **Preconditions** | `auto_invite_enabled = true`; `auto_invite_trigger = 'final_interview'`; candidate not already invited; job filter passes; location filter passes |
| **Action** | Send WorkVouch invitation email to candidate email from GH |
| **Delay** | `auto_invite_delay_hours` (default 0) |
| **Idempotency** | Check `ats_candidate_map.metadata.invited_at` — skip if already invited |
| **Failure** | Log to ats_sync_log; notify employer if email bounces |
| **Manual override** | Recruiter can send reminder from panel regardless |

---

## Rule 2: Auto-Invite — After Offer

| Attribute | Value |
|-----------|-------|
| **Rule ID** | `auto_invite_offer` |
| **Trigger** | Webhook `offer_created` OR stage change to "Offer" |
| **Preconditions** | Same as Rule 1 with `auto_invite_trigger = 'offer'` |
| **Action** | Send invitation email |
| **Use case** | Compliance-focused employers who verify post-offer |

---

## Rule 3: Auto-Invite — Immediately on Application

| Attribute | Value |
|-----------|-------|
| **Rule ID** | `auto_invite_immediate` |
| **Trigger** | Webhook `application_created` |
| **Preconditions** | `auto_invite_trigger = 'immediate'` |
| **Action** | Send invitation email |
| **Use case** | High-volume hiring; aggressive automation preset |
| **Risk** | May invite unqualified candidates — recommend job filter |

---

## Rule 4: Auto-Invite — Manual Only

| Attribute | Value |
|-----------|-------|
| **Rule ID** | `auto_invite_manual` |
| **Trigger** | None (disabled) |
| **Preconditions** | `auto_invite_enabled = false` OR `auto_invite_trigger = 'manual'` |
| **Action** | Recruiter clicks "Request verification" or "Invite" in panel |
| **Use case** | Conservative preset; pilot/testing phase |

---

## Rule 5: Job Filter — Selected Jobs Only

| Attribute | Value |
|-----------|-------|
| **Rule ID** | `job_filter_selected` |
| **Trigger** | Evaluated as precondition on all auto-invite rules |
| **Preconditions** | `job_filter_mode = 'selected'` |
| **Validation** | `external_job_id IN job_filter_ids` |
| **Action** | Skip auto-invite if job not in list |
| **Fallback** | Manual invite still available from panel |
| **Sync** | Job IDs synced from GH on connect + daily cron |

---

## Rule 6: Location Filter — Selected Locations Only

| Attribute | Value |
|-----------|-------|
| **Rule ID** | `location_filter_selected` |
| **Trigger** | Evaluated as precondition on all auto-invite rules |
| **Preconditions** | `location_filter_mode = 'selected'` |
| **Validation** | Job location country/state matches filter |
| **Location format** | `{ "country": "US", "state": "CA" }` or `{ "country": "US" }` (all US states) |
| **Hard rule** | No city/ZIP filtering (location safety policy) |
| **Fallback** | If job location unknown → skip filter (invite proceeds) |

---

## Rule 7: Trust Score Threshold

| Attribute | Value |
|-----------|-------|
| **Rule ID** | `trust_score_threshold` |
| **Trigger** | Evaluated on trust export |
| **Preconditions** | `trust_score_threshold > 0` |
| **Validation** | `trust_scores.score >= threshold` |
| **Action if below** | Export band = "Profile building"; skip numeric score |
| **Action if above** | Full export |
| **Manual override** | Recruiter sees full score in panel regardless of threshold |

| Threshold | Effect |
|-----------|--------|
| 0 | Export all |
| 40 | Moderate+ only in GH custom field |
| 60 | Strong+ only |
| 80 | Exceptional only |

---

## Rule 8: Auto-Export Trust Score

| Attribute | Value |
|-----------|-------|
| **Rule ID** | `auto_export_trust` |
| **Trigger** | Trust score change event OR cron (15 min) OR `auto_export_trigger = 'on_score_change'` |
| **Preconditions** | `auto_export_trust = true`; candidate linked; connection connected |
| **Action** | Export all trust custom fields to GH |
| **Idempotency** | Skip if score unchanged since `last_trust_export_at` |
| **Failure** | Retry 5x → DLQ → admin notification |

---

## Rule 9: Auto-Export Verification

| Attribute | Value |
|-----------|-------|
| **Rule ID** | `auto_export_verification` |
| **Trigger** | Verification status change OR cron (30 min) |
| **Preconditions** | Candidate linked; connection connected |
| **Action** | Export verification custom fields + optional note |
| **Idempotency** | Skip if status unchanged since `last_verification_export_at` |

---

## Rule 10: Reminder Schedule — Vouches

| Attribute | Value |
|-----------|-------|
| **Rule ID** | `vouch_reminder_schedule` |
| **Trigger** | Cron (daily at 9am employer timezone) |
| **Schedule** | Default: 3 days, 7 days, 14 days after request |
| **Max reminders** | 3 (configurable) |
| **Stop conditions** | Vouch submitted; candidate declined; max reached |
| **Weekend rule** | If due Sat/Sun → send Monday |
| **Action** | Send reminder email to reference provider |

---

## Rule 11: Reminder Schedule — Verification

| Attribute | Value |
|-----------|-------|
| **Rule ID** | `verify_reminder_schedule` |
| **Trigger** | Cron (daily at 9am) |
| **Schedule** | Default: 2 days, 5 days after request |
| **Max reminders** | 2 (configurable) |
| **Stop conditions** | Verified; declined; expired |
| **Action** | Send reminder email to verifier |

---

## Rule 12: Expiration Rules

| Attribute | Value |
|-----------|-------|
| **Rule ID** | `expiration_rules` |
| **Trigger** | Cron (daily at midnight UTC) |

| Item | Default Expiry | On Expiry |
|------|---------------|-----------|
| Invitation | 30 days | Status → Expired; recruiter can re-invite |
| Verification link | 14 days | Status → Expired; candidate can resend |
| Vouch request | 21 days | Status → Expired; candidate can resend |

---

## Rule 13: Retry on Export Failure

| Attribute | Value |
|-----------|-------|
| **Rule ID** | `export_retry` |
| **Trigger** | Trust/verification export failure |
| **Schedule** | 1m → 5m → 15m → 1h → 4h |
| **Max attempts** | 5 |
| **On exhaustion** | DLQ + admin notification |
| **Manual override** | Admin replay from DLQ or force export |

---

## Rule 14: Manual Override — Force Export

| Attribute | Value |
|-----------|-------|
| **Rule ID** | `manual_force_export` |
| **Trigger** | Recruiter clicks "Export" in panel OR admin clicks "Export all" |
| **Preconditions** | Candidate linked (any link status except unlinked) |
| **Action** | Immediate trust + verification export |
| **Bypasses** | Threshold filter (exports full score to GH) |

---

## Rule 15: Manual Override — Force Link

| Attribute | Value |
|-----------|-------|
| **Rule ID** | `manual_force_link` |
| **Trigger** | Recruiter confirms link in panel |
| **Preconditions** | GH candidate exists; WV profile exists |
| **Action** | Set link_status = manual_linked; trigger immediate export |
| **Sets** | `metadata.manual_override = true` |

---

## Automation Presets

| Preset | auto_invite | trigger | export | AI | threshold |
|--------|------------|---------|--------|-----|-----------|
| **Conservative** | false | manual | on verification | off | 0 |
| **Standard** | true | final_interview | on score change | on | 0 |
| **Aggressive** | true | phone_screen | on score change + daily | on | 0 |
| **Post-offer** | true | offer | on verification | on | 0 |

Presets applied on connect wizard or settings page. All fields customizable after preset selection.

---

## Rule Evaluation Order

```
1. Connection status = connected? (else skip all)
2. Job filter passes?
3. Location filter passes?
4. Auto-invite enabled + trigger matches?
5. Already invited? (idempotency)
6. Send invitation
7. On WV status change → auto-export if enabled
8. Threshold check on export
9. Export to GH custom fields
```

---

## Related Documents

- [03-status-mapping.md](./03-status-mapping.md)
- [06-sync-contract.md](./06-sync-contract.md)
- [07-custom-fields.md](./07-custom-fields.md)
- [docs/product-experience/10-settings-and-automation.md](../product-experience/10-settings-and-automation.md)
