# Backup and Restore

## Database (Supabase)

### Automatic Backups

Supabase Pro plan includes daily automated backups. Verify backup retention in Supabase dashboard.

### Critical Connect Tables

| Table | Priority |
|-------|----------|
| `connect_connections` | P0 — OAuth tokens |
| `connect_event_store` | P0 — audit trail |
| `connect_webhook_log` | P1 — DLQ recovery |
| `connect_sync_cursor` | P1 — incremental sync |
| `connect_candidate_map` | P1 — candidate links |
| `connect_lifecycle_state` | P2 — workflow |

### Manual Backup

```bash
supabase db dump -f connect-backup-$(date +%Y%m%d).sql
```

### Restore

1. Restore Supabase backup to staging first
2. Verify `connect_connections` token decryption works
3. Run integration test suite against staging
4. Promote to production only after validation

## Secrets Backup

Store securely (1Password / AWS Secrets Manager):

- `ATS_ENCRYPTION_KEY` — **loss = all tokens unrecoverable**
- `PANEL_JWT_SECRET`
- `GREENHOUSE_CLIENT_SECRET`
- `GREENHOUSE_WEBHOOK_SECRET`
- `CRON_SECRET`

## Event Store Recovery

Event store is append-only. Recovery = replay from snapshots + events:

- See `docs/connect/snapshots.md`
- See `docs/connect/replay.md`

## Related

- [rollback.md](./rollback.md)
- [../connect/database.md](../connect/database.md)
