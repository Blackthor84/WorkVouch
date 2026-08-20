# Diagnostic Bundle Format

Bundle version: **1.0.0**

## ZIP Layout

```
workvouch-connect-{provider}-{timestamp}.zip
├── README.md           # Human-readable support summary
├── manifest.json       # Bundle metadata + checksums
├── bundle.json         # Full redacted diagnostic payload
├── health.json         # Health report snapshot
├── events.json         # Recent universal events
├── sync.json           # Cursor + sync history
├── replay.json         # Replay references + instructions
├── errors.json         # Error summary
└── checksums.json      # Per-file SHA-256 checksums
```

## manifest.json

```json
{
  "bundleVersion": "1.0.0",
  "generatedAt": "2026-08-08T12:00:00.000Z",
  "connectionId": "uuid",
  "employerAccountId": "uuid",
  "provider": "greenhouse",
  "connectVersion": "1.0.0",
  "providerVersion": "1.0.0",
  "fileCount": 12,
  "redactionCount": 14,
  "checksums": {
    "bundle": "sha256-hex"
  }
}
```

## bundle.json Sections

| Section | Description |
|---------|-------------|
| `connection` | Connection metadata (status, scopes, sync times) |
| `health` | Full Connect health report |
| `syncCursor` | Incremental sync cursor position |
| `syncHistory` | Recent sync runs |
| `recentEvents` | Universal event store entries |
| `auditTrail` | Event audit timeline |
| `replayReferences` | Event/webhook replay IDs + instructions |
| `projectionState` | Webhook + lifecycle metrics snapshot |
| `platform` | Connect version + platform diagnostics |
| `providerManifest` | Provider capabilities and version |
| `connectionConfiguration` | Automation and OAuth scope config |
| `featureFlags` | Active Connect feature flags |
| `environmentValidation` | Required env var status |
| `performanceMetrics` | Webhook, lifecycle, hiring metrics |
| `errorSummary` | Recent errors with correlation IDs |
| `warningSummary` | Recent warnings |
| `logs` | Structured log timeline |
| `redactions` | List of redacted paths and reasons |

## Replay References

Each entry in `replay.json`:

```json
{
  "eventId": "evt-uuid",
  "correlationId": "corr-uuid",
  "aggregateType": "candidate",
  "aggregateId": "cand-1",
  "universalEvent": "CandidateImported",
  "replayInstruction": "POST /api/employer/integrations/connections/{connectionId}/events/{eventId}/replay with mode simulation"
}
```

## Configurable Limits

| Option | Default | Max recommended |
|--------|---------|-----------------|
| `maxEvents` | 100 | 500 |
| `maxLogs` | 200 | 1000 |

## Validation

`BundleValidator` checks:

- Required manifest fields
- Required sections present
- `recentEvents` and `replayReferences` are arrays
- No secret leaks post-redaction
- No unredacted token fields

## Checksums

`checksums.json` contains SHA-256 hashes for each ZIP member file. Support can verify bundle integrity before analysis.
