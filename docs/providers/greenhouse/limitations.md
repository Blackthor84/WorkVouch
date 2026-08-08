# Greenhouse Provider — Limitations (Sprint 3B-1)

## Functional

- No candidate, job, or application synchronization
- No webhook receipt or processing
- No employer-facing connect UI or API routes
- No database persistence for connections or tokens
- No custom field mapping
- No attachment handling
- No reference request support

## Storage

- Tokens and OAuth state are in-memory only (lost on process restart)
- Single-process; not suitable for multi-instance production without Sprint 3B-2

## Operations

- No live sandbox integration tests in CI
- Webhook secret validated as warning only

## Security

- Base64 token fallback when encryption key absent (development only)
