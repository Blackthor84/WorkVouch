# Release Checklist

## Pre-Release

- [ ] All integration tests pass (`npm test`)
- [ ] No P0/P1 items open in SECURITY_REVIEW.md
- [ ] Environment variables documented and set in staging
- [ ] Migrations applied to staging
- [ ] OAuth smoke test on staging
- [ ] Webhook smoke test on staging
- [ ] Panel demo scenarios verified
- [ ] CHANGELOG updated

## Release

- [ ] Deploy to production
- [ ] Apply migrations (if any)
- [ ] Verify `ATS_ENABLED=true`, `GREENHOUSE_ENABLED=true`
- [ ] Verify production secrets (no dev fallbacks)
- [ ] OAuth connect with test employer account
- [ ] Receive test webhook
- [ ] Download diagnostic bundle

## Post-Release

- [ ] Monitor webhook error rate (30 min)
- [ ] Monitor OAuth connect success (30 min)
- [ ] No spike in support tickets
- [ ] Update PRODUCTION_READINESS_REPORT if scores changed

## Rollback Criteria

- OAuth failure rate > 10%
- Webhook signature validation broken
- Token encryption errors in logs

See [rollback.md](./rollback.md).

## Marketplace Submission

- [ ] Demo URLs documented in [demo-script.md](../marketplace/demo-script.md)
- [ ] Review checklist complete
- [ ] Screenshots captured
