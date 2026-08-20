# OAuth Persistence

Sprint 5 replaces in-memory OAuth storage with persistent encrypted storage.

## Stored Fields

| Field | Table | Encrypted |
|-------|-------|-----------|
| Access token | `connect_connections.access_token_encrypted` | Yes |
| Refresh token | `connect_connections.refresh_token_encrypted` | Yes |
| Token expiration | `connect_connections.token_expires_at` | No |
| Token status | `connect_connections.token_status` | No |
| OAuth scopes | `connect_connections.oauth_scopes` | No |
| PKCE verifier | `connect_oauth_state.code_verifier_encrypted` | Yes |
| OAuth state | `connect_oauth_state.state` | No |

## Encryption

```typescript
import { ConnectSecureTokenStorage } from "@/lib/integrations/connect";

const storage = new ConnectSecureTokenStorage();
const encrypted = storage.encrypt("access-token-plaintext");
```

Set `ATS_ENCRYPTION_KEY` (base64-encoded 32-byte key) in production.

## OAuth Flow

1. `ConnectionManager.startOAuth()` — creates pending connection + saves PKCE state
2. User authorizes at provider
3. `GreenhouseOAuthService.completeConnect()` — exchanges code for tokens
4. `ConnectTokenStoreAdapter.saveConnection()` — encrypts and persists tokens
5. `ConnectionManager.testConnection()` — verifies via Harvest `/users/me`

## Connection ID Consistency

The same `connectionId` flows through start → callback → import. Sprint 5 fixes the Sprint 3B-1 bug where start and complete generated different UUIDs.

## Migration

```
supabase/migrations/20260808130000_connect_oauth_snapshots.sql
```

Adds token columns to `connect_connections` and creates `connect_oauth_state` table.
