# Marketplace Architecture

```
Greenhouse Hookshot
       ↓ HMAC webhook
/api/integrations/v1/webhooks/greenhouse
       ↓
Connect Event Store → Projection → Lifecycle Engine
       ↓
Employer Portal + Embedded Panel
       ↓
Hiring Confidence Engine (presentation)
```

## Components

| Layer | Technology |
|-------|------------|
| OAuth | PKCE + CSRF state in `connect_oauth_state` |
| Tokens | AES-256-GCM in `connect_connections` |
| Events | Append-only `connect_event_store` |
| Sync | Incremental cursor in `connect_sync_cursor` |
| Panel | JWT (15 min) + iframe at `/integrations/greenhouse/panel` |
| Intelligence | Event-sourced hiring metrics |

## Data Flow

1. Candidate applies in Greenhouse
2. Webhook → WorkVouch event store
3. Email match → `connect_candidate_map`
4. Lifecycle engine evaluates automation rules
5. Panel displays Hiring Confidence + verification

## Security Boundary

- All Connect DB access via service role (server-side only)
- Employer routes require session + connection ownership
- Webhook HMAC verification before processing
- Diagnostic bundles auto-redact secrets

## Related

- [../connect/architecture.md](../connect/architecture.md)
- [security.md](./security.md)
