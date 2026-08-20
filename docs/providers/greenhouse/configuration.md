# Greenhouse Provider — Configuration

## Environment-Driven

All configuration is loaded from environment variables or injected `ProviderConfiguration`. No hardcoded secrets.

## Validation

`validateGreenhouseConfig()` checks:

- `GREENHOUSE_CLIENT_ID` present
- `GREENHOUSE_CLIENT_SECRET` present
- Harvest base URL uses HTTPS
- Warns if webhook secret missing

`validateGreenhouseConfigOnStartup()` can be called at application boot when Greenhouse is enabled.

## Resolution Order

1. Explicit `ProviderConfiguration` (client ID + secret)
2. Environment variables (`GREENHOUSE_*`)
3. Throws if neither available

## Harvest Client Settings

| Setting | Env Var | Default |
|---------|---------|---------|
| Base URL | `GREENHOUSE_BASE_URL` | `https://harvest.greenhouse.io/v1` |
| Timeout | `GREENHOUSE_TIMEOUT_MS` | 10000 |
| Max retries | `GREENHOUSE_MAX_RETRIES` | 5 |
| Backoff | — | [1000, 2000, 4000, 8000, 16000] ms |

## Feature Flag

`GREENHOUSE_ENABLED` must be `true` (with `ATS_ENABLED=true`) for registry to return the provider instance.

Registration always occurs; the flag gates runtime usage.
