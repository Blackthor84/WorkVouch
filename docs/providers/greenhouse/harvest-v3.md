# Harvest V3 API (WorkVouch Connect)

Base URL: `https://harvest.greenhouse.io/v3` (override with `GREENHOUSE_BASE_URL`).

## Supported resources (Sprint 12)

| Resource | Endpoint | Scope |
|---|---|---|
| Candidates | `GET /v3/candidates` | `harvest:candidates:list` |
| Candidate employments | `GET /v3/candidate_employments` | `harvest:candidate_employments:list` |
| Applications | `GET /v3/applications` | `harvest:applications:list` |
| Jobs | `GET /v3/jobs` | `harvest:jobs:list` |
| Job interview stages | `GET /v3/job_interview_stages` | `harvest:job_interview_stages:list` |
| Custom fields | `GET /v3/custom_fields` | `harvest:custom_fields:list` |

Single-resource reads use list endpoints with `ids=` query parameter per V3 docs.

## Authentication

`Authorization: Bearer {access_token}`

## Incremental sync

First list request may include `updated_at={iso8601}` filter. Provider pagination cursor URLs must be followed without additional query params.

## Implementation

- Client: `lib/integrations/providers/greenhouse/api/harvest-client.ts`
- Import: `lib/integrations/providers/greenhouse/sync/harvest-import-service.ts`
- Universal mapping: `lib/integrations/providers/greenhouse/mappers/*`
