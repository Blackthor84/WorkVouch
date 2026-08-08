# Incident Response

## Severity Levels

| Level | Example | Response Time |
|-------|---------|---------------|
| SEV1 | Token leak, mass webhook failure | Immediate |
| SEV2 | OAuth down, panel unavailable | < 1 hour |
| SEV3 | Stale sync, single employer affected | < 4 hours |
| SEV4 | UI glitch, non-blocking | Next business day |

## SEV1 — Security / Data Breach

1. Set `ATS_ENABLED=false`
2. Rotate compromised secrets (see [secret-rotation.md](./secret-rotation.md))
3. Invalidate all OAuth tokens: mark connections `reconnect_required`
4. Preserve logs and `connect_webhook_log` for forensics
5. Notify affected employers within 24 hours

## SEV2 — Connect Unavailable

1. Check Supabase status
2. Verify env vars present (`validateConnectProductionSecrets`)
3. Check Vercel deployment logs
4. Rollback if recent deploy (see [rollback.md](./rollback.md))
5. Monitor `connect_webhook_log` for backlog

## SEV3 — Employer-Reported Issue

1. Request diagnostic bundle from employer
2. Review `connect_webhook_log` + health report
3. Replay failed webhooks in simulation mode
4. Escalate to SEV2 if widespread

## Communication Template

> We identified an issue affecting WorkVouch Connect for Greenhouse. [Impact]. We have [action taken]. Estimated resolution: [time]. No candidate PII was exposed in webhook logs (payload hash only).

## Escalation

- Engineering lead → OAuth/webhook failures
- Security → token or secret exposure
- Support → single-employer triage with diagnostic bundle

## Related

- [on-call-runbook.md](./on-call-runbook.md)
- [greenhouse-outage-playbook.md](./greenhouse-outage-playbook.md)
