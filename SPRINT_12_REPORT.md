# Sprint 12 Report — Greenhouse Harvest V3 + Partner OAuth Migration

**Operation Greenhouse — Sprint 12**  
**Date:** 2026-08-20

## Mission outcome

WorkVouch Connect Greenhouse integration is **technically migrated** to Partner OAuth + Harvest V3. The codebase is ready for validation against the real Greenhouse **testing** client. Live sandbox OAuth has **not** been executed in this sprint (credentials must not be logged; sandbox run is manual).

---

## COMPLETED

| Area | Detail |
|---|---|
| Partner OAuth URLs | `/authorize`, `/token` |
| Token exchange | HTTP Basic auth, query params, no browser secret exposure |
| Token refresh | Rotates access + refresh tokens; supports `expires_at` |
| CSRF state | Preserved (mandatory) |
| PKCE | Disabled for partner flow (`pkceRequired: false`) |
| Approved scopes | 7 granular scopes in `config/scopes.ts` |
| Harvest V3 base URL | Default `https://harvest.greenhouse.io/v3` |
| V3 list endpoints | candidates, applications, jobs, candidate_employments, job_interview_stages, custom_fields |
| Cursor pagination | Link header parser + resumable provider cursors |
| Sync cursor integration | WorkVouch cursor unchanged; provider `*NextUrl` keys added |
| Custom field mapper | V1 array + V3 object map normalization |
| Health service | OAuth config, token expiry, V3 probe, scopes, webhooks |
| Token storage | Existing encrypted Connect architecture preserved |
| Webhook pipeline | Preserved (Hookshot ingress unchanged) |
| MockATS | Unchanged |
| Unit tests | **342 passed**, 1 skipped |
| Production build | **Passes** (`npm run build`) |
| Documentation | Audit + 6 provider docs + CHANGELOG |

---

## SANDBOX VERIFIED

_None — live Greenhouse sandbox was not exercised in this engineering sprint._

---

## BLOCKED UNTIL SANDBOX

| Item | Reason |
|---|---|
| Full OAuth consent → callback → exchange | Requires manual run with testing client |
| V3 response field validation | Real payload shapes must be confirmed |
| Pagination across large datasets | Requires sandbox data volume |
| Incremental `updated_at` sync proof | Requires sandbox timeline |
| Custom field write-back | Requires field catalog + employer mapping |
| Webhook delivery vs Hookshot fixtures | Partner delivery model unverified |

---

## BLOCKED BY GREENHOUSE

| Item | Reason |
|---|---|
| Partner webhook registration API | Not documented/verified for WorkVouch client |
| Token revoke endpoint for Partner OAuth | Revoke URL undocumented; best-effort legacy path retained |

---

## NOT IMPLEMENTED

| Item | Reason |
|---|---|
| Automated sandbox smoke suite (live HTTP) | Opt-in gate only; no credentials in CI |
| Candidate custom field PATCH on import | Explicit write path deferred until sandbox mapping |
| `harvest:webhooks:*` scopes | Not in approved testing client scope list |

---

## Final readiness score

| Dimension | Score | Notes |
|---|---|---|
| OAuth compliance (code) | **9/10** | Matches partner guide; sandbox unverified |
| Harvest V3 compliance (code) | **8/10** | Cursor pagination + endpoints; payload QA pending |
| Security | **9/10** | No secret exposure; encrypted storage preserved |
| Sync architecture | **9/10** | Dual-cursor model documented |
| Webhooks | **5/10** | Ingress solid; partner model unverified |
| Test coverage | **8/10** | Strong unit tests; no live sandbox |
| **Overall** | **8/10** | Ready for sandbox validation, not marketplace sign-off |

---

## Files changed

### Modified (13)
- `lib/integrations/providers/greenhouse/config/manifest.ts`
- `lib/integrations/providers/greenhouse/config/greenhouse-config.ts`
- `lib/integrations/providers/greenhouse/auth/oauth-service.ts`
- `lib/integrations/providers/greenhouse/api/harvest-client.ts`
- `lib/integrations/providers/greenhouse/sync/harvest-import-service.ts`
- `lib/integrations/providers/greenhouse/health/greenhouse-health-service.ts`
- `lib/integrations/providers/greenhouse/provider.ts`
- `lib/integrations/providers/greenhouse/types/index.ts`
- `lib/integrations/providers/greenhouse/models/index.ts`
- `lib/integrations/providers/greenhouse/mappers/customFieldMapper.ts`
- `lib/integrations/providers/greenhouse/fixtures/responses.ts`
- `tests/integrations/greenhouse-provider.test.ts`
- `tests/integrations/connect-sprint5.test.ts`
- `tests/integrations/connect-sync-cursor.test.ts`
- `CHANGELOG.md`

### Created (10)
- `lib/integrations/providers/greenhouse/config/scopes.ts`
- `lib/integrations/providers/greenhouse/api/link-pagination.ts`
- `tests/integrations/greenhouse-v3-migration.test.ts`
- `tests/integrations/greenhouse-sandbox-smoke.test.ts`
- `docs/audits/greenhouse-v3-migration-audit.md`
- `docs/providers/greenhouse/oauth-v3.md`
- `docs/providers/greenhouse/harvest-v3.md`
- `docs/providers/greenhouse/pagination.md`
- `docs/providers/greenhouse/sandbox-testing.md`
- `docs/providers/greenhouse/webhooks.md`
- `docs/providers/greenhouse/custom-fields.md`
- `SPRINT_12_REPORT.md`

---

## Next steps

1. Configure `GREENHOUSE_CLIENT_ID` / `GREENHOUSE_CLIENT_SECRET` in staging (Vercel env — never commit).
2. Run manual checklist: `docs/providers/greenhouse/sandbox-testing.md`
3. Validate webhook payloads against Hookshot ingress or partner docs.
4. Map WorkVouch custom field names after catalog import.
