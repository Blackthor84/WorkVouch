# Greenhouse Provider — Testing

## Run Tests

```bash
npx vitest run tests/integrations/greenhouse-provider.test.ts
npx vitest run tests/integrations/ats-platform.test.ts
```

## Test Strategy

- **Mock HTTP** — `MockHttpClient` simulates OAuth token endpoint and Harvest `/users/me`
- **In-memory stores** — token and OAuth state stores for isolation
- **No sandbox** — no live Greenhouse credentials required for CI

## Coverage Areas

| Area | Test |
|------|------|
| Registry | ProviderLoader registers Greenhouse |
| Feature flags | Disabled when `GREENHOUSE_ENABLED=false` |
| Configuration | Env validation and resolution |
| OAuth | PKCE URL, state validation, token exchange |
| Refresh | Token refresh updates connection |
| Disconnect | Revocation + health degradation |
| Harvest | testConnection, healthCheck, rate limit retry |
| Not implemented | sync/webhook throw `NotImplementedYetError` |

## Fixtures

`lib/integrations/providers/greenhouse/fixtures/responses.ts` provides stable mock responses.

## Injecting Dependencies

```typescript
createGreenhouseRegistration({
  config: TEST_CONFIG,
  http: mockHttp,
  tokenStore: new InMemoryTokenStore(),
  stateStore: new InMemoryOAuthStateStore(),
});
```
