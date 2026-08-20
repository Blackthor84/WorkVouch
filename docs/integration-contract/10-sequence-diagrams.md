# 10 — Sequence Diagrams

> **Sprint:** Operation Greenhouse — Sprint 2.75 (Integration Contracts)  
> **Last updated:** 2026-08-07  
> **Status:** Design specification — no implementation

---

## 1. Candidate Imported (Webhook → Auto-Link)

```mermaid
sequenceDiagram
  participant GH as Greenhouse
  participant WH as Webhook Endpoint
  participant VAL as Validator
  participant LOG as ats_webhook_log
  participant BUS as Event Bus
  participant SYNC as CandidateSyncService
  participant MAP as ats_candidate_map
  participant WV as WorkVouch DB

  GH->>WH: POST candidate_created
  WH->>VAL: verifyWebhook(signature)
  VAL-->>WH: valid
  WH->>LOG: persist (status=received)
  WH->>BUS: publish inbound.candidate.created
  WH-->>GH: 200 OK

  BUS->>SYNC: process event
  SYNC->>MAP: lookup by external_candidate_id
  MAP-->>SYNC: not found
  SYNC->>WV: email match (profiles.email)
  WV-->>SYNC: 1 match found
  SYNC->>MAP: upsert (auto_linked)
  SYNC->>LOG: update (status=processed)
```

---

## 2. Candidate Invited (Auto-Invite on Stage Change)

```mermaid
sequenceDiagram
  participant GH as Greenhouse
  participant WH as Webhook Endpoint
  participant BUS as Event Bus
  participant AUTO as AutomationEngine
  participant PREFS as sync_preferences
  participant INV as InvitationService
  participant EMAIL as Email Service
  participant CAND as Candidate

  GH->>WH: POST application_updated (stage=Final Interview)
  WH-->>GH: 200 OK
  WH->>BUS: publish inbound.application.updated

  BUS->>AUTO: evaluate rules
  AUTO->>PREFS: check auto_invite_enabled, trigger, filters
  PREFS-->>AUTO: enabled, final_interview, job passes
  AUTO->>AUTO: check not already invited
  AUTO->>INV: create invitation
  INV->>EMAIL: send invitation email
  EMAIL->>CAND: "Acme Corp invited you to WorkVouch"
  AUTO->>AUTO: set metadata.invited_at
```

---

## 3. Reference Submitted (Vouch → Trust Update)

```mermaid
sequenceDiagram
  participant REF as Reference Provider
  participant WV as WorkVouch App
  participant TRUST as Trust Engine
  participant BUS as Event Bus
  participant SYNC as TrustExportService
  participant GH as Greenhouse API
  participant PANEL as GH Panel

  REF->>WV: Submit vouch (token auth)
  WV->>TRUST: recalculate trust score
  TRUST-->>WV: score 65 → 78
  WV->>BUS: publish outbound.trust_score.export

  BUS->>SYNC: export trust
  SYNC->>GH: PATCH /v1/candidates/{id} custom_fields
  GH-->>SYNC: 200 OK
  SYNC->>SYNC: update last_trust_export_at

  Note over PANEL: Recruiter refreshes panel
  PANEL->>WV: GET /panel/greenhouse/{id}
  WV-->>PANEL: trustScore: 78, band: Strong
```

---

## 4. Verification Complete

```mermaid
sequenceDiagram
  participant VER as Verifier
  participant WV as WorkVouch App
  participant VR as verification_requests
  participant TRUST as Trust Engine
  participant BUS as Event Bus
  participant SYNC as VerificationExportService
  participant GH as Greenhouse API

  VER->>WV: Confirm employment (token auth)
  WV->>VR: status = verified
  WV->>TRUST: recalculate score
  TRUST-->>WV: score updated
  WV->>BUS: publish outbound.verification.export
  WV->>BUS: publish outbound.trust_score.export

  BUS->>SYNC: export verification
  SYNC->>GH: PATCH custom_fields (verification_status=verified)
  SYNC->>GH: POST activity_feed/notes (optional)
  GH-->>SYNC: 200 OK
```

---

## 5. Trust Score Updated (Cron Export)

```mermaid
sequenceDiagram
  participant CRON as Cron Job
  participant TS as TrustExportService
  participant WV as trust_scores
  participant MAP as ats_candidate_map
  participant GH as Greenhouse API
  participant LOG as ats_sync_log

  CRON->>TS: runTrustExportBatch()
  TS->>MAP: get linked candidates where score changed since last export
  MAP-->>TS: 12 candidates

  loop Each candidate
    TS->>WV: read trust_scores (READ ONLY)
    WV-->>TS: score, band, counts
    TS->>GH: PATCH custom_fields
    alt Success
      GH-->>TS: 200
      TS->>LOG: status=success
    else Rate limited
      GH-->>TS: 429
      TS->>TS: schedule retry with backoff
    end
  end

  TS-->>CRON: batch result (12 success, 0 failed)
```

---

## 6. Greenhouse Updated (Outbound Export)

```mermaid
sequenceDiagram
  participant WV as WorkVouch
  participant ADAPTER as GreenhouseAdapter
  participant GH as Harvest API
  participant GHUI as Greenhouse UI
  participant REC as Recruiter

  WV->>ADAPTER: upsertCustomFields(candidateId, fields)
  ADAPTER->>GH: PATCH /v1/candidates/{id}
  Note over ADAPTER,GH: workvouch_trust_score=78<br/>workvouch_trust_band=Strong<br/>workvouch_vouch_count=5
  GH-->>ADAPTER: 200 updated candidate
  ADAPTER-->>WV: SyncResult success

  REC->>GHUI: Open candidate list
  GHUI-->>REC: Trust Score column shows 78
  REC->>GHUI: Open candidate profile
  GHUI-->>REC: Custom fields panel shows all WV fields
```

---

## 7. Employer Connects (OAuth Flow)

```mermaid
sequenceDiagram
  participant ADMIN as Employer Admin
  participant WV as WorkVouch Settings
  participant OAUTH as OAuth Service
  participant GH as Greenhouse OAuth
  participant CONN as ats_connections
  participant WH as Webhook Registration
  participant SYNC as Initial Sync

  ADMIN->>WV: Click "Connect Greenhouse"
  WV->>OAUTH: POST /connect/greenhouse
  OAUTH->>OAUTH: generate state + PKCE
  OAUTH-->>WV: authorizationUrl
  WV->>GH: Redirect to GH OAuth consent
  ADMIN->>GH: Approve access
  GH->>WV: Redirect /callback?code=xxx&state=yyy
  WV->>OAUTH: validate state, exchange code
  OAUTH->>GH: POST /oauth/token
  GH-->>OAUTH: access_token, refresh_token
  OAUTH->>CONN: store encrypted tokens (status=connected)
  OAUTH->>WH: POST /v1/webhook_endpoints (register all events)
  WH-->>OAUTH: webhook IDs
  OAUTH->>SYNC: trigger initial candidate sync
  SYNC-->>OAUTH: 847 candidates linked
  OAUTH-->>WV: connected=true
  WV-->>ADMIN: "Greenhouse connected — 847 candidates linked"
```

---

## 8. Employer Disconnects

```mermaid
sequenceDiagram
  participant ADMIN as Employer Admin
  participant WV as WorkVouch Settings
  participant OAUTH as OAuth Service
  participant GH as Greenhouse OAuth
  participant CONN as ats_connections
  participant MAP as ats_candidate_map

  ADMIN->>WV: Click "Disconnect"
  WV->>ADMIN: Confirm modal ("Sync stops. Data preserved.")
  ADMIN->>WV: Confirm
  WV->>OAUTH: DELETE /disconnect/greenhouse
  OAUTH->>GH: POST /oauth/revoke (optional)
  OAUTH->>CONN: status=disconnected, zero tokens
  Note over MAP: Maps preserved for reconnect
  OAUTH-->>WV: disconnectedAt
  WV-->>ADMIN: "Greenhouse disconnected"
```

---

## 9. Webhook Received (Full Lifecycle)

```mermaid
sequenceDiagram
  participant GH as Greenhouse
  participant EP as Webhook Endpoint
  participant VAL as Validator
  participant DEDUP as Deduplicator
  participant LOG as ats_webhook_log
  participant STORE as Supabase Storage
  participant BUS as Event Bus
  participant WORKER as EventWorker
  participant SYNC as SyncService
  participant DLQ as Dead Letter Queue

  GH->>EP: POST webhook
  EP->>VAL: verify signature
  alt Invalid
    VAL-->>EP: false
    EP-->>GH: 401
  else Valid
    EP->>DEDUP: check eventId
    alt Duplicate
      EP-->>GH: 200 (skip)
    else New
      EP->>STORE: store raw payload
      EP->>LOG: status=received
      EP->>BUS: enqueue event
      EP->>LOG: status=queued
      EP-->>GH: 200 OK
      BUS->>WORKER: process
      WORKER->>SYNC: handle event
      alt Success
        SYNC-->>WORKER: done
        WORKER->>LOG: status=processed
      else Retryable failure
        WORKER->>WORKER: schedule retry (backoff)
      else Non-retryable
        WORKER->>DLQ: move to DLQ
        WORKER->>LOG: status=failed
      end
    end
  end
```

---

## 10. OAuth Flow (Detailed)

```mermaid
sequenceDiagram
  participant ADMIN as Admin Browser
  participant WV as WorkVouch API
  participant STATE as ats_oauth_states
  participant GH as Greenhouse
  participant TOKEN as Token Store
  participant CONN as ats_connections

  ADMIN->>WV: POST /connect/greenhouse
  WV->>STATE: create state (15 min TTL, CSRF)
  WV-->>ADMIN: { authorizationUrl, state }

  ADMIN->>GH: GET /oauth/authorize?client_id=...&state=...&code_challenge=...
  GH-->>ADMIN: Consent screen
  ADMIN->>GH: Approve
  GH-->>ADMIN: Redirect /callback?code=AUTH_CODE&state=STATE

  ADMIN->>WV: GET /callback?code=AUTH_CODE&state=STATE
  WV->>STATE: validate state (not expired, matches)
  WV->>GH: POST /oauth/token (code + code_verifier)
  GH-->>WV: { access_token, refresh_token, expires_in }
  WV->>TOKEN: encrypt and store tokens
  WV->>CONN: status=connected, provider_account_id
  WV->>GH: GET /v1/users/me (health check)
  GH-->>WV: { id, name }
  WV-->>ADMIN: Redirect /settings/integrations?connected=true
```

---

## Related Documents

- [04-webhook-contract.md](./04-webhook-contract.md)
- [05-api-contract.md](./05-api-contract.md)
- [06-sync-contract.md](./06-sync-contract.md)
- [08-automation-rules.md](./08-automation-rules.md)
