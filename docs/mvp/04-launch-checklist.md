# 04 — Launch Checklist

> **Sprint:** Operation Greenhouse — Sprint 2.9 (MVP Lock)  
> **Last updated:** 2026-08-07

---

## Development

- [ ] All `ats_*` tables migrated with RLS
- [ ] `AtsProvider` interface implemented
- [ ] `MockAtsAdapter` passes contract tests
- [ ] `GreenhouseAdapter` complete (OAuth, webhooks, sync, custom fields)
- [ ] Event bus + worker + retry + DLQ operational
- [ ] All 15 `/api/integrations/v1/` endpoints functional
- [ ] 9 cron jobs deployed and scheduled
- [ ] Employer integration settings page live
- [ ] Greenhouse embedded panel live
- [ ] Demo environment deployed
- [ ] All panel states implemented and tested
- [ ] Auto-invite at Final Interview working
- [ ] Manual link/unlink working
- [ ] Trust export to 6 GH custom fields working

---

## Testing

- [ ] Unit tests: 54 cases passing (MockAtsAdapter)
- [ ] Contract tests: 12 schema validations passing
- [ ] Integration tests: 15 scenarios passing (GH sandbox)
- [ ] Webhook tests: 11 event types verified
- [ ] OAuth tests: 8 flow scenarios passing
- [ ] Sync tests: 10 scenarios passing
- [ ] UI tests: 10 panel/settings scenarios passing
- [ ] Failure tests: 8 failure injection scenarios passing
- [ ] Recovery tests: 5 recovery scenarios passing
- [ ] Regression tests: 6 existing feature areas unaffected
- [ ] Acceptance tests: 8 marketplace demo scenarios passing
- [ ] Load test: 50 webhooks/min processed
- [ ] Load test: 100 concurrent panel requests p99 <3s
- [ ] No P0 or P1 bugs open

---

## Security

- [ ] OAuth tokens encrypted (AES-256-GCM)
- [ ] Webhook secrets encrypted
- [ ] HMAC-SHA256 signature verification on all webhooks
- [ ] Timing-safe signature comparison
- [ ] RLS policies on all `ats_*` tables verified
- [ ] No secrets in application logs
- [ ] Webhook payloads stored in Supabase Storage (not DB rows)
- [ ] Panel JWT auth with 15-min expiry
- [ ] CSRF protection on OAuth (state token)
- [ ] Rate limiting on integration API endpoints
- [ ] Vouch text export blocked (verified in code review)
- [ ] Location data limited to country/state (verified in code review)
- [ ] `admin` Supabase client used in all API routes
- [ ] CRON_SECRET on all cron endpoints

---

## Performance

- [ ] Panel API p95 <800ms (cached)
- [ ] Panel API p95 <3s (fresh)
- [ ] Webhook response p99 <500ms
- [ ] OAuth connect flow <10s
- [ ] Trust export single candidate <2s
- [ ] Initial sync 1000 candidates <30 min
- [ ] No N+1 queries in sync batch operations

---

## Documentation

- [x] Architecture docs (Sprint 1)
- [x] Integration platform design (Sprint 2)
- [x] Product experience blueprint (Sprint 2.5)
- [x] Integration contracts (Sprint 2.75)
- [x] MVP definition + roadmap (Sprint 2.9)
- [x] Architecture Decision Records (Sprint 2.9)
- [x] Engineering charter (Sprint 2.9)
- [ ] Public installation guide
- [ ] Public troubleshooting guide
- [ ] Public FAQ for integration errors
- [ ] API error code reference (customer-facing subset)

---

## Marketplace

- [ ] GH sandbox app registered and tested
- [ ] GH production app registered
- [ ] 6 screenshots at 1280×800 minimum
- [ ] 90-second demo video produced
- [ ] Short description finalized
- [ ] Long description finalized
- [ ] Pricing tiers published
- [ ] Privacy policy URL linked
- [ ] Support email in listing
- [ ] Demo URL in listing
- [ ] Categories: Background Checks, Candidate Experience, Analytics
- [ ] Listing submitted via GH partner portal

---

## Support

- [ ] support@workvouch.com active and monitored
- [ ] 24h business day SLA documented
- [ ] Escalation runbook written
- [ ] Common error troubleshooting guide published
- [ ] Internal ops runbook for DLQ/token expiry/sync failure

---

## Monitoring

- [ ] Webhook receipt rate metric
- [ ] Webhook processing success rate metric
- [ ] Sync success/failure rate metric
- [ ] Token expiry alert (P0)
- [ ] DLQ depth alert (>10 events = P1)
- [ ] Panel API latency metric
- [ ] GH API rate limit hit counter
- [ ] Connection health check daily cron
- [ ] Admin notification on token expiry
- [ ] Admin notification on DLQ threshold

---

## Beta

- [ ] 3+ beta customers recruited (see [08-beta-plan.md](./08-beta-plan.md))
- [ ] Beta customers connected and syncing
- [ ] Beta feedback collected (≥4/5 satisfaction)
- [ ] Beta bugs triaged and P0/P1 resolved
- [ ] Beta exit criteria met

---

## Production

- [ ] Production environment variables set (`ATS_ENCRYPTION_KEY`, `GH_CLIENT_ID`, `GH_CLIENT_SECRET`, `PANEL_JWT_SECRET`, `CRON_SECRET`)
- [ ] Production GH OAuth app credentials configured
- [ ] Production webhook URL registered with GH
- [ ] Production cron jobs scheduled
- [ ] Database migrations applied to production
- [ ] Feature flag for integration (enable for beta → enable for all)
- [ ] Rollback plan documented and tested
- [ ] On-call rotation defined for launch week

---

## Launch Day

- [ ] Marketplace listing approved
- [ ] Feature flag enabled for all customers
- [ ] Monitoring dashboards green
- [ ] Support team briefed
- [ ] Launch announcement prepared
- [ ] Post-launch 90-day plan active (see [09-post-launch-roadmap.md](./09-post-launch-roadmap.md))

---

## Related Documents

- [01-mvp-definition.md](./01-mvp-definition.md)
- [03-greenhouse-review-checklist.md](./03-greenhouse-review-checklist.md)
- [08-beta-plan.md](./08-beta-plan.md)
- [10-final-go-no-go.md](./10-final-go-no-go.md)
