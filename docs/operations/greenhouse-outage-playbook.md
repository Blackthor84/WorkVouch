# Greenhouse Outage Playbook

## Symptoms

- Harvest API 5xx/503 errors
- Webhook delivery stops
- OAuth token refresh failures
- Health component `harvest` unhealthy

## Immediate Actions

1. Confirm outage at [Greenhouse status page](https://status.greenhouse.io) (if available)
2. Do **not** disable WorkVouch Connect — webhooks will queue at Greenhouse
3. Monitor `connect_webhook_log` for backlog after recovery
4. Set employer banner: "Greenhouse API experiencing delays"

## During Outage

- Webhooks: return 200 to Greenhouse (already implemented) — internal retry handles failures
- Sync: incremental sync will fail gracefully; cursor not advanced on failure
- Panel: show cached data + stale banner (`ConnectionBanner` stale state)
- OAuth: new connects may fail — display retry message

## After Recovery

1. Run health check per affected connection
2. Trigger incremental sync from employer portal
3. Replay dead-letter webhooks from Replay Center
4. Verify `connect_sync_cursor` advanced

## Rate Limiting (429)

Harvest client implements exponential backoff (5 attempts). No manual action unless sustained 429.

## Related

- [incident-response.md](./incident-response.md)
- [../connect/recovery.md](../connect/recovery.md)
