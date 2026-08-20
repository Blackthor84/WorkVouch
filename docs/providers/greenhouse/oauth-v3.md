# Greenhouse Partner OAuth (Harvest V3)

WorkVouch Connect uses the **Greenhouse Partner OAuth 2.0 Authorization Code Grant**.

## Endpoints

| Step | URL |
|---|---|
| Authorize | `https://auth.greenhouse.io/authorize` |
| Token | `https://auth.greenhouse.io/token` |
| Callback | `https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback` |

## Authorization request

Required query parameters:

- `response_type=code`
- `client_id`
- `redirect_uri`
- `scope` (space-separated approved scopes)
- `state` (CSRF — mandatory in WorkVouch)

PKCE is **not** used for the partner testing client.

## Token exchange

`POST https://auth.greenhouse.io/token?grant_type=authorization_code&code={code}`

Headers:

- `Authorization: Basic base64(client_id:client_secret)`

The client secret is read from `GREENHOUSE_CLIENT_SECRET` only — never sent to the browser.

## Token refresh

`POST https://auth.greenhouse.io/token?grant_type=refresh_token&refresh_token={token}`

Same Basic auth header. Replace **both** access and refresh tokens on success.

## Approved scopes

See `lib/integrations/providers/greenhouse/config/scopes.ts`.

## Environment variables

- `GREENHOUSE_CLIENT_ID`
- `GREENHOUSE_CLIENT_SECRET`
- `GREENHOUSE_WEBHOOK_SECRET` (webhook ingress only)

Do not commit credentials. Do not log the client secret.
