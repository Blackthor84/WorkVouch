# Diagnostic Bundle Support Workflow

## Customer Report

> "Our Greenhouse integration stopped working."

## Step 1 — Request Bundle

Ask the employer to:

1. Open **Integrations → Greenhouse → Provider details**
2. Click **Download Diagnostic Bundle**
3. Attach the ZIP to the support ticket

No screenshots. No log exports. No token sharing.

## Step 2 — Verify Bundle

1. Unzip the archive
2. Open `README.md` for quick summary
3. Check `manifest.json` for bundle version and generation time
4. Verify `checksums.json` matches file hashes

## Step 3 — Triage Health

Open `health.json`:

| Component | Action if unhealthy |
|-----------|---------------------|
| `oauth` | Guide customer through Reconnect |
| `harvest` | Check Greenhouse API status / rate limits |
| `cursor` | Review sync lag; may need incremental resync |
| `projection` | Check event store lag |
| `database` | Escalate to platform team |

## Step 4 — Review Failures

1. `errors.json` — top errors with correlation IDs
2. `sync.json` — last successful sync vs cursor position
3. `events.json` — recent universal events timeline

## Step 5 — Replay (Simulation First)

From `replay.json`:

```
POST /api/employer/integrations/connections/{connectionId}/events/{eventId}/replay
Body: { "mode": "simulation" }
```

Or replay failed webhooks:

```
POST /api/employer/integrations/connections/{connectionId}/replay
Body: { "webhookLogId": "...", "mode": "simulation" }
```

Always simulate before live replay.

## Step 6 — Root Cause Categories

| Symptom | Likely cause | Bundle evidence |
|---------|--------------|-----------------|
| No new candidates | OAuth expired | `health.oauth` unhealthy |
| Partial sync | Cursor behind | `syncCursor` vs `syncHistory` |
| Webhook failures | Signature / payload | `errors.json`, failed webhook logs |
| Automation not firing | Rule config | `connectionConfiguration.automation` |
| Duplicate events | Idempotency | `recentEvents` duplicate keys |

## Step 7 — Resolution

Document in ticket:

- Root cause from bundle evidence
- Replay IDs used
- Customer action (reconnect, re-import, settings change)
- Post-fix bundle comparison (optional)

## Escalation

Escalate to engineering when:

- Bundle validation fails (possible redaction gap)
- Health components healthy but events not projecting
- Replay simulation succeeds but live fails
- Database component unhealthy

Attach the full ZIP — never paste redacted fields into Slack unencrypted.

## API Preview (Internal)

```
GET /api/employer/integrations/connections/{id}/diagnostic-bundle?preview=1
```

Returns estimated size, health status, top errors, and suggested next steps without full download.
