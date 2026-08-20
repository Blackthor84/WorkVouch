# Greenhouse Sandbox Testing Checklist

**Never use production Greenhouse accounts.**  
**Never print credentials in test output.**

Enable opt-in automated gate:

```bash
GREENHOUSE_SANDBOX_SMOKE=true npm test -- tests/integrations/greenhouse-sandbox-smoke.test.ts
```

## Manual checklist (testing client)

1. OAuth authorization URL opens Greenhouse consent
2. User authorizes WorkVouch testing client
3. Callback receives `code` + valid `state`
4. Token exchange succeeds (Basic auth)
5. Tokens persist encrypted in `connect_connections`
6. `GET /v3/candidates?per_page=1` succeeds
7. `GET /v3/applications?per_page=1` succeeds
8. `GET /v3/jobs?per_page=1` succeeds
9. `GET /v3/candidate_employments?per_page=1` succeeds
10. `GET /v3/job_interview_stages?per_page=1` succeeds
11. `GET /v3/custom_fields?per_page=1` succeeds
12. Link header pagination across 2+ pages (if data available)
13. Incremental import with `updated_at`
14. Access token refresh + refresh token rotation
15. Disconnect clears local tokens
16. Reconnect repeats OAuth flow
17. Connect health dashboard reports OAuth + Harvest status

## Failure scenarios

- Invalid redirect URI → OAuth error redirect
- Invalid state → callback rejected
- Expired authorization code → exchange error + reconnect prompt
- Expired access token → refresh or reconnect
- 403 on list endpoints → Site Admin authorization required (document in runbook)
- 429 → respect `Retry-After`

## Status

| Item | Status |
|---|---|
| Unit tests (mock HTTP) | ✅ Complete |
| Live sandbox OAuth | **BLOCKED UNTIL SANDBOX** (requires manual run with testing client) |
