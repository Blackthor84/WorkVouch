# Greenhouse OAuth Redirect URI Audit

**Date:** 2026-08-14  
**Scope:** Audit only — no code changes  
**Purpose:** Determine the exact redirect URI to register with Greenhouse Partner Support for the Harvest V3 **testing** OAuth client  
**Reference:** [Greenhouse Partner OAuth Guide](https://harvestdocs.greenhouse.io/docs/harvest-partner-oauth)

---

## Executive summary

WorkVouch implements **one canonical Greenhouse OAuth callback** as a Next.js API route. The redirect URI sent to Greenhouse at authorization time is built dynamically from the incoming request origin — it is **not** read from `GREENHOUSE_REDIRECT_URI` at runtime (that env var is documented but unused in the OAuth start path).

### Recommended redirect URI (register with Greenhouse testing client)

```
https://workvouch.com/api/integrations/v1/connect/greenhouse/callback
```

**No trailing slash.**

**Pre-registration verification required:** Confirm that employers initiating Connect OAuth use `https://workvouch.com` as the browser origin. If the live employer app is served from another host (e.g. `https://tryworkvouch.com`), register that host instead — Greenhouse requires an **exact** match with the `redirect_uri` query parameter.

---

## 1. Current route / file

| Item | Value |
|------|--------|
| **Canonical callback route** | `GET /api/integrations/v1/connect/greenhouse/callback` |
| **Implementation file** | `app/api/integrations/v1/connect/greenhouse/callback/route.ts` |
| **HTTP method** | `GET` only |
| **OAuth flow role** | Receives `code` + `state` from Greenhouse; exchanges code for tokens; redirects employer to `/employer/integrations/connect?step=validate` |

### OAuth initiation (where `redirect_uri` is set)

| Route | File | How `redirect_uri` is constructed |
|-------|------|-----------------------------------|
| `POST /api/employer/integrations/connect/greenhouse` | `app/api/employer/integrations/connect/greenhouse/route.ts` | `` `${origin}/api/integrations/v1/connect/greenhouse/callback` `` |
| `POST /api/employer/integrations/connections/[connectionId]/reconnect` | `app/api/employer/integrations/connections/[connectionId]/reconnect/route.ts` | Same pattern |

Where `origin = new URL(request.url).origin` (browser-visible host + scheme).

### Supporting OAuth implementation

| Component | Path |
|-----------|------|
| OAuth service | `lib/integrations/providers/greenhouse/auth/oauth-service.ts` |
| OAuth config (URLs, scopes) | `lib/integrations/providers/greenhouse/config/manifest.ts` |
| Provider wiring | `lib/integrations/providers/greenhouse/provider.ts` |
| State persistence | `connect_oauth_state` table via Connect runtime |

---

## 2. Current public URL / domain

### Implemented callback path (fixed)

```
/api/integrations/v1/connect/greenhouse/callback
```

### Hostname (variable — depends on deployment)

The **hostname is not hardcoded** in OAuth start routes. It equals whatever origin the employer uses when clicking “Connect with Greenhouse.”

| Source | Domain referenced |
|--------|-------------------|
| Marketplace / integration docs | `workvouch.com` |
| `lib/integrations/greenhouse/panel/panel-service.ts` fallback | `https://workvouch.com` |
| `NEXTAUTH_SETUP.md`, contact constants | `tryworkvouch.com` |
| Supabase email functions fallback | `app.workvouch.com` |
| Local dev | `http://localhost:3000` |

**Env var `GREENHOUSE_REDIRECT_URI`:** Defined in `env.mjs` and `lib/integrations/config/connect-env.ts` but **not consumed** by `connect/greenhouse/route.ts` or `reconnect/route.ts`. Marketplace docs suggest setting it for operator reference only.

**Env var `NEXT_PUBLIC_APP_URL`:** Documented as required for OAuth in `docs/operations/production-deployment.md`, but OAuth callback URL is derived from **request origin**, not this variable directly.

---

## 3. Is the route deployed?

### In codebase

- Route exists and is included in production build output (`ƒ /api/integrations/v1/connect/greenhouse/callback`).
- Implemented on branch `feature/greenhouse-platform` (Connect Sprint 5–10 work).

### Live deployment

**Not verifiable from repository alone.** Deployment depends on:

1. Whether `feature/greenhouse-platform` (or a branch containing this route) is deployed to the target host
2. Whether `ATS_ENABLED=true` and `GREENHOUSE_ENABLED=true` are set in that environment
3. Whether `GREENHOUSE_CLIENT_ID` / `GREENHOUSE_CLIENT_SECRET` are configured

**Before giving Greenhouse the redirect URI:** Hit the callback URL on the target host (expect 400 JSON `"code and state are required"` when called without query params — that confirms the route is live).

Example smoke test:

```http
GET https://workvouch.com/api/integrations/v1/connect/greenhouse/callback
```

Expected if deployed: `400` with `{ "error": "code and state are required" }` (not 404).

---

## 4. Does it accept Greenhouse Partner authorization code flow?

### What the callback implements (matches Partner Step 3)

| Partner requirement | WorkVouch implementation | Status |
|--------------------|--------------------------|--------|
| `GET` callback endpoint | `GET` handler | ✅ |
| Accept `code` query param | Reads `code` | ✅ |
| Accept `state` query param | Reads `state`, validates against `connect_oauth_state` | ✅ |
| Handle `error` query param | Redirects to employer connect page with error | ✅ |
| Exchange code for tokens (Step 4) | `GreenhouseOAuthService.completeConnect()` → `exchangeAuthorizationCode()` | ✅ Implemented (see §6 for partner compatibility) |
| Redirect user on success | 302 → `/employer/integrations/connect?step=validate&connected=greenhouse` | ✅ |

### Authorization URL generation (Partner Step 2)

| Partner requirement | WorkVouch | Status |
|--------------------|-----------|--------|
| `response_type=code` | Set | ✅ |
| `client_id` | Set from `GREENHOUSE_CLIENT_ID` | ✅ |
| `redirect_uri` | Set from stored OAuth state | ✅ |
| `scope` | Space-separated scopes from manifest | ✅ (scope **values** differ — see §6) |
| `state` | Generated, stored, single-use | ✅ |

**Conclusion:** The callback route is designed for the standard OAuth 2.0 authorization **code** flow. Full end-to-end success with Greenhouse Partner credentials has **not** been verified in this audit (requires live partner client + sandbox).

---

## 5. Does it expect the old OAuth implementation?

**Partially — yes.** The current code reflects an **earlier / non-partner** OAuth profile, not the published Harvest V3 Partner guide.

Evidence:

| Aspect | Current code | Partner OAuth guide |
|--------|--------------|---------------------|
| Authorize URL | `https://auth.greenhouse.io/oauth/authorize` | `https://auth.greenhouse.io/authorize` |
| Token URL | `https://auth.greenhouse.io/oauth/token` | `https://auth.greenhouse.io/token` |
| Token auth | `client_id` + `client_secret` in **form body** | `Authorization: Basic base64(id:secret)` header |
| Token params | Form body: `grant_type`, `code`, `redirect_uri`, `code_verifier` | Query string: `grant_type`, `code` |
| PKCE | **Required** (`code_challenge`, `code_verifier`) | **Not documented** in partner guide |
| Scopes | `harvest:read`, `harvest:write`, `harvest:webhooks` | Granular V3 scopes (e.g. `harvest:candidates:list`) |
| Harvest API | `https://harvest.greenhouse.io/v1` (V1) | Harvest **V3** API |

The **callback path and code/state handling** align with partner Step 3. The **authorize/token endpoints and token exchange mechanics** do not match the current partner documentation without code changes (out of scope for this audit).

---

## 6. Changes needed for `auth.greenhouse.io/authorize` and `auth.greenhouse.io/token`?

**Yes — for Partner OAuth compliance per official docs.**

Current manifest (`lib/integrations/providers/greenhouse/config/manifest.ts`):

```typescript
authorizationUrl: "https://auth.greenhouse.io/oauth/authorize",
tokenUrl: "https://auth.greenhouse.io/oauth/token",
```

Partner guide requires:

```
https://auth.greenhouse.io/authorize
https://auth.greenhouse.io/token
```

Additional changes likely required for successful token exchange (not redirect URI, but affects whether callback completes):

1. Switch token requests to `Authorization: Basic` header
2. Move `grant_type` and `code` to query parameters (partner curl examples)
3. Remove or make optional PKCE params (partner guide silent on PKCE)
4. Update scopes to partner-issued granular V3 scopes
5. Update Harvest client base URL from `/v1` to V3

**Redirect URI itself does not need to change** for the authorize/token host migration — only the OAuth service endpoints and exchange format.

---

## 7. Trailing slash

| Check | Result |
|-------|--------|
| Code constructs callback | `` `${origin}/api/integrations/v1/connect/greenhouse/callback` `` — **no trailing slash** |
| Marketplace installation guide | No trailing slash |
| Greenhouse partner doc examples | No trailing slash on callback path |

**Recommendation:** Register **without** trailing slash:

✅ `https://workvouch.com/api/integrations/v1/connect/greenhouse/callback`  
❌ `https://workvouch.com/api/integrations/v1/connect/greenhouse/callback/`

OAuth redirects must match the registered URI **exactly** (Greenhouse returns `invalid_request` if `redirect_uri` is not configured for the client).

---

## 8. Other Greenhouse callback URLs in the repository

| URL / pattern | Type | Notes |
|---------------|------|-------|
| `/api/integrations/v1/connect/greenhouse/callback` | **Live OAuth callback** | Only production callback route |
| `https://workvouch.com/employer/settings/integrations/greenhouse/callback` | Documentation only | In `docs/integration-contract/05-api-contract.md` — **no matching route in `app/`** |
| `GET /connect/{provider}/callback` | Documentation only | Contract shorthand — actual path is under `/api/integrations/v1/` |
| `https://workvouch.test/callback` | Test fixture | `tests/integrations/greenhouse-provider.test.ts` |
| `https://app.workvouch.com/callback` | Test fixture | `tests/integrations/connect-sprint5.test.ts` |
| `/auth/callback` | Supabase auth | Unrelated to Greenhouse |
| `/api/integrations/v1/webhooks/greenhouse` | Webhook ingress | Not an OAuth redirect URI |

**There is only one real Greenhouse OAuth redirect callback in the application.**

---

## Redirect URI decision matrix

| Candidate | Use for Greenhouse registration? |
|-----------|-----------------------------------|
| `https://workvouch.com/api/integrations/v1/connect/greenhouse/callback` | **Recommended** — matches marketplace docs and integration API base |
| `https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback` | Only if employer portal is served from this host |
| `http://localhost:3000/api/integrations/v1/connect/greenhouse/callback` | Local dev only — do not register on partner testing client |
| `https://workvouch.com/employer/settings/integrations/greenhouse/callback` | **Do not use** — not implemented |

---

## Pre-submission checklist for Partner Support

Provide Greenhouse Partner Support:

1. **Redirect URI:** `https://workvouch.com/api/integrations/v1/connect/greenhouse/callback`
2. **Environment:** `testing` (WorkVouch sandbox / partner testing client)
3. **Integration name:** WorkVouch Connect
4. **Required scopes:** List granular V3 scopes after internal scope audit (current code uses legacy `harvest:read` / `harvest:write` / `harvest:webhooks` — must align with partner-issued scopes)
5. **Logo:** 128×128 per partner guide

Before OAuth testing:

- [ ] Confirm callback route returns non-404 on chosen host
- [ ] Confirm employer Connect flow uses the **same host** registered with Greenhouse
- [ ] Plan follow-up engineering to align authorize/token URLs and token exchange with partner guide (§6)

---

## Related audits

- `docs/audits/03-partner-oauth-audit.md` — OAuth implementation vs partner guide
- `docs/audits/01-greenhouse-partner-audit.md` — Partner readiness overview
- `docs/marketplace/installation-guide.md` — Operator install steps

---

## Audit conclusion

| Question | Answer |
|----------|--------|
| Canonical callback route? | `GET /api/integrations/v1/connect/greenhouse/callback` |
| Register with Greenhouse? | `https://workvouch.com/api/integrations/v1/connect/greenhouse/callback` (verify host) |
| Trailing slash? | No |
| Authorization code flow? | Yes (callback designed for it) |
| Partner OAuth URLs today? | No — uses `/oauth/authorize` and `/oauth/token` |
| Other Greenhouse callbacks? | None implemented besides this API route |
| Code changes in this audit? | **None** |
