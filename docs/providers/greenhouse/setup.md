# Greenhouse Provider — Setup

## Prerequisites

- Greenhouse Harvest API OAuth application (client ID + secret)
- WorkVouch ATS Integration Platform (Sprint 3A+)
- Node.js environment with Vitest

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ATS_ENABLED` | Yes | Master flag for ATS platform (`true`) |
| `GREENHOUSE_ENABLED` | Yes | Enables Greenhouse provider usage |
| `GREENHOUSE_CLIENT_ID` | Yes | OAuth client ID |
| `GREENHOUSE_CLIENT_SECRET` | Yes | OAuth client secret |
| `GREENHOUSE_WEBHOOK_SECRET` | No | Required when webhooks ship (Sprint 3B-3+) |
| `GREENHOUSE_BASE_URL` | No | Defaults to `https://harvest.greenhouse.io/v1` |
| `GREENHOUSE_TIMEOUT_MS` | No | HTTP timeout (default 10000) |
| `GREENHOUSE_MAX_RETRIES` | No | Max retry attempts (default 5) |
| `ATS_ENCRYPTION_KEY` | Recommended | Base64 AES-256 key for token encryption at rest |

## Registration

Greenhouse registers automatically via `ProviderLoader.loadBuiltInProviders()`:

```typescript
import { IntegrationManager } from "@/lib/integrations";

const manager = new IntegrationManager();
const provider = manager.getProvider("greenhouse");
```

## OAuth Redirect URI

Configure your Greenhouse OAuth app redirect URI to match WorkVouch callback routes (employer UI ships in a later sprint). For foundation testing, use unit tests with `MockHttpClient`.

## Local Development

1. Set environment variables above.
2. Run tests: `npx vitest run tests/integrations/greenhouse-provider.test.ts`
3. Provider uses in-memory token/state stores until Sprint 3B-2 (database persistence).

## Security Notes

- Tokens are encrypted at rest when `ATS_ENCRYPTION_KEY` is set.
- PKCE is required for all authorization flows.
- Never commit client secrets or encryption keys.
