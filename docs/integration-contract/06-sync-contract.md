# 06 — Sync Contract

> **Sprint:** Operation Greenhouse — Sprint 2.75 (Integration Contracts)  
> **Last updated:** 2026-08-07  
> **Status:** Design specification — no implementation

---

## Sync Direction Matrix

| Data Domain | Direction | Source of Truth | Sprint |
|-------------|-----------|-----------------|--------|
| Candidate identity (name, email) | GH → WV | Greenhouse | 3 |
| Application status / stage | GH → WV | Greenhouse | 3 |
| Job metadata | GH → WV | Greenhouse | 5 |
| Trust score | WV → GH | WorkVouch | 3 |
| Trust band | WV → GH | WorkVouch | 3 |
| Verification status | WV → GH | WorkVouch | 4 |
| Vouch count (aggregate) | WV → GH | WorkVouch | 3 |
| Vouch text | ❌ Never | WorkVouch (private) | — |
| AI summary | WV → GH | WorkVouch | 4 |
| Profile URL | WV → GH | WorkVouch | 3 |
| Link status | WV internal | WorkVouch | 3 |
| Automation settings | WV internal | WorkVouch | 3 |

---

## One-Way Sync (Inbound: GH → WV)

### Candidate Sync

**Trigger:** Webhook (`candidate_created`, `candidate_updated`), cron (every 6h), manual sync.

**Flow:**
```
1. Fetch CanonicalCandidate from GH adapter
2. Lookup ats_candidate_map by (connection_id, external_candidate_id)
3. If not found:
   a. Email match: profiles.email ILIKE candidate.email
   b. 0 matches → link_status = 'pending'
   c. 1 match → link_status = 'auto_linked', set workvouch_profile_id
   d. 2+ matches → link_status = 'ambiguous'
4. If found: update metadata (name, email, application_status, job_id)
5. Write ats_sync_log
6. NEVER create new WV profiles automatically (Sprint 3)
```

**What is NOT synced inbound:**
- Trust scores
- Verification data
- Location beyond country/state
- Phone numbers (Sprint 3)

---

### Job Sync

**Trigger:** Webhook (`job_created`, `job_updated`), cron (daily).

**Flow:**
```
1. Fetch CanonicalJob from GH adapter
2. Upsert ats_job_map
3. Normalize location to country/state only
4. Drop record if US location missing state
5. Write ats_sync_log
```

**Sprint:** 5 (automation filters use job IDs from Sprint 3 via webhook payload).

---

### Application Status Sync

**Trigger:** Webhook (`application_updated`, `hire_candidate`, `reject_candidate`).

**Flow:**
```
1. Extract current_stage.name
2. Map to canonical ApplicationStatus
3. Update ats_candidate_map.application_status
4. If stage changed: evaluate auto-invite rules
5. Write ats_sync_log
```

---

## One-Way Sync (Outbound: WV → GH)

### Trust Score Export

**Trigger:** Trust score change event, cron (every 15 min), manual export, post-verification.

**Flow:**
```
1. Read trust_scores for profileId (READ ONLY — never recalculate)
2. Compute band via getTrustBandLabel(score)
3. Check export threshold (sync_preferences.trust_score_threshold)
4. If below threshold: export "Profile building" to band field; skip score
5. Build CanonicalTrustExport
6. Call adapter.upsertCustomFields()
7. Update ats_candidate_map.last_trust_export_at
8. Write ats_sync_log
```

**Fields exported:**
- `workvouch_trust_score`
- `workvouch_trust_band`
- `workvouch_vouch_count`
- `workvouch_verification_count`
- `workvouch_profile_url`
- `workvouch_last_synced_at`

---

### Verification Export

**Trigger:** Verification status change, cron (every 30 min), manual export.

**Flow:**
```
1. Read verification_requests + employment_records (READ ONLY)
2. Build CanonicalVerificationExport
3. Call adapter.upsertCustomFields() for status + count
4. Optionally call adapter.addNote() (if configured)
5. Update ats_candidate_map.last_verification_export_at
6. Write ats_sync_log
```

---

### AI Summary Export

**Trigger:** AI regeneration, included in trust export batch if AI enabled.

**Flow:**
```
1. Read cached AI summary (or generate if stale >15 min)
2. Truncate to 255 chars
3. Export to workvouch_ai_summary custom field
4. Write ats_sync_log
```

**Fallback:** If AI unavailable, export structured string: `"{score} {band} · {n} vouches · {n} verified"`.

---

## Two-Way Sync

**None in Sprint 3–5.** All sync is unidirectional per domain. No field is written by both systems.

Future consideration (Sprint 8+): Saved candidates bidirectional sync — requires explicit approval.

---

## Conflict Handling

| Field | Conflict Scenario | Resolution | Action |
|-------|------------------|------------|--------|
| Trust score | GH custom field manually edited | WV wins | Re-export on next sync |
| Verification status | GH field manually edited | WV wins | Re-export |
| Application status | WV cache stale | GH wins | Accept GH value |
| Candidate email | GH email changed | GH wins for cache | Re-evaluate link |
| Link (same email, different GH ID) | Duplicate | Manual resolution | Flag ambiguous |
| Name | GH vs WV profile differ | Independent | GH updates cache; WV profile unchanged |

**Conflict detection:** Compare `last_trust_export_at` vs GH field `updated_at` (if available). If GH field newer than last export → log warning, re-export.

---

## Duplicate Detection

### Email Duplicate (Auto-Link)

```
Input: GH candidate email
Query: SELECT * FROM profiles WHERE LOWER(email) = LOWER($email)
Results:
  0 → pending link
  1 → auto link
  2+ → ambiguous
```

### GH Candidate ID Duplicate

```
Constraint: UNIQUE (connection_id, external_candidate_id)
If violated: Skip upsert; log warning
```

### Profile Already Linked

```
Query: SELECT * FROM ats_candidate_map
       WHERE workvouch_profile_id = $profileId
       AND external_candidate_id != $newGhId
       AND link_status NOT IN ('unlinked', 'external_deleted')
If found: Return 409 CONFLICT on manual link
```

---

## Deleted Records

### Candidate Deleted in Greenhouse

**Trigger:** Webhook `candidate_deleted` or GH API 404 on fetch.

**Action:**
```
1. Set ats_candidate_map.link_status = 'external_deleted'
2. Do NOT delete WV profile
3. Do NOT clear GH custom fields (GH handles on deletion)
4. Notify employer admin
5. Panel shows: "Candidate removed from Greenhouse"
```

### Candidate Deleted in WorkVouch

**Action:**
```
1. Set ats_candidate_map.workvouch_profile_id = NULL
2. Set link_status = 'unlinked'
3. Do NOT delete GH custom fields (stale data acceptable)
4. Log event
```

### Job Deleted/Closed in Greenhouse

**Trigger:** Webhook `job_deleted` or job status = closed.

**Action:**
```
1. Update ats_job_map.job_status = 'closed'
2. Remove from automation job filter if configured
3. Do NOT affect existing candidate maps
```

---

## Archived Candidates

Greenhouse "archived" candidates:
- Still accessible via Harvest API
- Webhooks may not fire for archived candidates
- **WorkVouch behavior:** Continue to sync trust exports if linked; mark metadata `archived: true`
- Panel shows archived badge if detected

---

## Manual Overrides

| Override | Who | Effect | Persists Until |
|----------|-----|--------|---------------|
| Manual link | Recruiter/Admin | Sets link_status = manual_linked | Unlink |
| Manual unlink | Admin | Sets link_status = unlinked | Re-link |
| Skip auto-invite | Admin setting | Disables auto-invite | Re-enabled |
| Force export | Recruiter/Admin | Immediate trust export | Next scheduled sync |
| Block export | Admin (threshold) | Score below threshold not exported | Threshold lowered |
| Replay event | Admin | Re-processes failed webhook/sync | Success or DLQ |

**Manual override flag:** Stored in `ats_candidate_map.metadata.manual_override = true`. Prevents auto-unlink on email change.

---

## Sync Frequency

| Sync Type | Trigger | Frequency | Priority |
|-----------|---------|-----------|----------|
| Webhook processing | Inbound webhook | Real-time (<1 min) | P0 |
| Trust score export | Score change + cron | 15 min | P0 |
| Verification export | Status change + cron | 30 min | P1 |
| Candidate pull | Cron | 6 hours | P1 |
| Job pull | Cron | Daily | P2 |
| Token refresh | Cron | Daily (proactive) | P0 |
| Health check | Cron | Daily | P1 |
| DLQ retry | Cron | 5 min | P0 |
| Full sync | Manual | On demand | P2 |

---

## Queue Priority

| Priority | Event Types | Max Wait |
|----------|------------|----------|
| P0 (critical) | Token refresh failure, webhook processing | 30s |
| P1 (high) | Trust export, verification export, auto-invite | 2 min |
| P2 (normal) | Candidate sync, job sync | 15 min |
| P3 (low) | AI summary regeneration, batch cleanup | 1 hour |

**Queue implementation:** `ats_events` table with `priority` column. Worker processes P0 first.

---

## Recovery

### Catch-Up Sync (After Disconnect/Reconnect)

```
1. Admin reconnects OAuth
2. System triggers full trust export batch for all linked candidates
3. Pull candidates updated since last_sync_at
4. Process any DLQ events for this connection
5. Notify admin: "Catch-up sync complete — {n} candidates updated"
```

### Partial Batch Failure

```
Batch: 100 candidates
  95 success → logged individually
  3 retryable → requeued with backoff
  2 non-retryable → DLQ
Batch status: 'partial'
Admin notification if failure rate > 10%
```

### Stale Data Recovery

```
If last_trust_export_at > 24 hours AND connection status = 'connected':
  1. Mark candidate map as 'stale'
  2. Trigger trust export on next cron cycle
  3. Panel shows amber "Stale" badge until refreshed
```

---

## Sync Log Schema

Every operation writes to `ats_sync_log`:

```json
{
  "id": "uuid",
  "employerAccountId": "uuid",
  "provider": "greenhouse",
  "connectionId": "uuid",
  "eventId": "uuid-or-null",
  "operation": "trust_score_export | candidate_sync | verification_export | auto_invite | manual_link",
  "direction": "inbound | outbound",
  "entityType": "candidate | job | connection",
  "workvouchProfileId": "uuid-or-null",
  "externalCandidateId": "12345",
  "status": "success | partial | failed | skipped",
  "fieldsUpdated": ["workvouch_trust_score"],
  "durationMs": 342,
  "attemptCount": 1,
  "errorCode": null,
  "errorMessage": null,
  "metadata": {},
  "createdAt": "2026-08-07T20:00:00Z"
}
```

**Retention:** 90 days active; archive to cold storage after.

---

## Related Documents

- [02-field-mapping.md](./02-field-mapping.md)
- [03-status-mapping.md](./03-status-mapping.md)
- [04-webhook-contract.md](./04-webhook-contract.md)
- [docs/integrations/05-sync-engine.md](../integrations/05-sync-engine.md)
