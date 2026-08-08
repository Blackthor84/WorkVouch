# Greenhouse Provider — Capabilities

## Manifest

See `GREENHOUSE_MANIFEST` in `lib/integrations/providers/greenhouse/config/manifest.ts`.

## Feature Flags

| Flag | Default | Effect |
|------|---------|--------|
| `supportsOAuth` | true | OAuth 2.0 PKCE connect |
| `supportsWebhooks` | true | Declared; processing not implemented |
| `supportsCandidates` | true | Declared; sync not implemented |
| `supportsJobs` | true | Declared; sync not implemented |
| `supportsApplications` | true | Declared; sync not implemented |
| `supportsCustomFields` | true | Declared for future mapping |
| `supportsStatusSync` | true | Declared for future sprint |
| `supportsReferenceRequests` | false | Not supported by Greenhouse Harvest |
| `supportsBatchSync` | true | Declared for future bulk operations |
| `supportsAttachments` | false | Out of scope for MVP |

## Platform Features

Mapped to `ProviderCapabilities.features`:

- `oauth`, `webhooks`, `candidate_sync`, `job_sync`, `application_sync`
- `custom_fields`, `notes`, `bulk_export`

## Rate Limits

- 50 requests per 10-second window (per Greenhouse documentation)
- Client retries on 429 with `Retry-After` header support

## Authentication Type

`oauth2_pkce`
