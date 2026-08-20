# Support

## Self-Service

1. **Health Dashboard** — `/employer/integrations/health`
2. **Event Explorer** — inspect webhook and sync events
3. **Replay Center** — retry failed events
4. **Diagnostic Bundle** — download from connection details (redacted JSON)

## Common Issues

| Issue | Resolution |
|-------|------------|
| Connection needs reconnect | Employer portal → Reconnect |
| Webhooks failing | Verify webhook secret; replay from DLQ |
| Panel not loading | Check panel token expiry; verify iframe URL |
| No candidate linked | Email must match WorkVouch profile |

## Contact

- **Email:** support@workvouch.com
- **Enterprise:** account manager
- **Security:** security@workvouch.com

## SLA (Enterprise)

- P1: 1 hour response
- P2: 4 hour response
- P3: next business day

## What to Include

- Connection ID (from employer portal)
- Diagnostic bundle (preferred)
- Timestamp of issue
- Greenhouse candidate ID (if panel issue)

## Internal Runbooks

Operations team: [../operations/on-call-runbook.md](../operations/on-call-runbook.md)
