# Provider Checklist

> **Sprint:** 3A  
> **Last updated:** 2026-08-07

---

## Before Starting

- [ ] Provider ID added to `AtsProviderId` type
- [ ] Feature flag defined in `FeatureFlagService`
- [ ] ADR or design doc reviewed (`docs/integration-contract/`)

## Implementation

- [ ] `AtsProvider` interface fully implemented
- [ ] `getCapabilities()` returns accurate manifest
- [ ] `validateConfiguration()` checks required env vars
- [ ] `connect()` / `disconnect()` / `refreshToken()` implemented
- [ ] `healthCheck()` / `testConnection()` implemented
- [ ] `syncCandidate()` / `syncJob()` / `syncApplication()` implemented
- [ ] `receiveWebhook()` validates signature + parses events
- [ ] No vouch text or PII exported (privacy rules)
- [ ] Location limited to country/state

## Registration

- [ ] `createXRegistration()` factory exported
- [ ] Registered via `ProviderLoader`
- [ ] Feature flag default: **disabled** until configured

## Testing

- [ ] Unit tests with mock/sandbox
- [ ] Contract tests pass
- [ ] Webhook signature tests (valid + invalid)
- [ ] OAuth flow tests (connect, refresh, disconnect)
- [ ] Health state tests (healthy, degraded, oauth_expired)

## Documentation

- [ ] Field mapping documented
- [ ] Webhook events documented
- [ ] Error codes documented
- [ ] Runbook updated

## Marketplace (if applicable)

- [ ] OAuth app registered (sandbox + production)
- [ ] Demo environment updated
- [ ] Installation guide updated
