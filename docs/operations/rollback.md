# Rollback Procedure

## When to Rollback

- OAuth connect failure rate > 10% for 15 minutes
- Webhook processing error rate > 25%
- Data corruption in `connect_event_store`
- Security incident involving token exposure

## Rollback Steps

1. **Disable Connect** — set `ATS_ENABLED=false` (immediate kill switch)
2. **Revert deployment** — roll back to previous Vercel deployment
3. **Preserve data** — do NOT roll back database migrations
4. **Notify employers** — connection may show stale; reconnect may be required
5. **Verify** — employer portal loads; no new webhook processing

## Database Rollback

Connect migrations are **additive only**. Do not drop `connect_*` tables on rollback.

If bad data was written:
- Mark affected connections `status = 'error'` in `connect_connections`
- Replay from last known good sync cursor checkpoint
- Use diagnostic bundle for support triage

## OAuth During Rollback

Existing encrypted tokens remain valid in `connect_connections`. Rollback does not invalidate tokens unless encryption key changes.

**Never rotate `ATS_ENCRYPTION_KEY` during rollback** — tokens become undecryptable.

## Recovery After Rollback

1. Root-cause fix on branch
2. Deploy fix
3. Re-enable `ATS_ENABLED=true`
4. Run health check per connection
5. Trigger incremental sync from employer portal

## Related

- [incident-response.md](./incident-response.md)
- [backup-and-restore.md](./backup-and-restore.md)
