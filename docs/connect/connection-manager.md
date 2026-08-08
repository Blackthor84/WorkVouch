# Connection Manager

Provider-agnostic connection lifecycle management for WorkVouch Connect.

## Capabilities

| Operation | Method | Description |
|-----------|--------|-------------|
| Create | `createPendingConnection()` | Create pending OAuth connection |
| Start OAuth | `startOAuth()` | Persist PKCE state + pending connection |
| Complete | `completeConnection()` | Store encrypted tokens, mark connected |
| Get | `getConnection()` / `getTokens()` | Read connection + decrypted tokens |
| Refresh | `refreshTokens()` | Update tokens after OAuth refresh |
| Disconnect | `disconnect()` | Clear tokens, mark disconnected |
| Expire | `markExpired()` | Mark connection expired |
| Health | `updateHealth()` | Record health check result |
| Test | `testConnection()` | Run provider API test callback |
| Scopes | `validateScopes()` | Verify required OAuth scopes |

## Usage

```typescript
import { ConnectionManager, InMemoryConnectionRepository, InMemoryOAuthStateRepository } from "@/lib/integrations/connect";

const connections = new ConnectionManager({
  connections: new InMemoryConnectionRepository(),
  oauthStates: new InMemoryOAuthStateRepository(),
});

const { connectionId, state } = await connections.startOAuth({
  employerAccountId: "employer-1",
  provider: "greenhouse",
  redirectUri: "https://app.workvouch.com/callback",
  requiredScopes: ["harvest:read"],
  codeVerifier,
  state,
});
```

## Token Encryption

Tokens are encrypted at rest via `ConnectSecureTokenStorage` (AES-256-GCM when `ATS_ENCRYPTION_KEY` is set).

## Provider Adapter

Greenhouse uses `ConnectTokenStoreAdapter` to bridge the existing `TokenStore` interface to `ConnectionManager`.

## Future Providers

Lever and other providers reuse `ConnectionManager` unchanged — only provider-specific OAuth and API clients differ.
