# 02 — Harvest V3 Audit

**Date:** 2026-08-13  
**Source of truth:** [Harvest V3 docs](https://harvestdocs.greenhouse.io/docs/pagination), codebase inspection

---

## Executive Answer

**A. Are we using Harvest V3?**  
**NO.** WorkVouch uses **Harvest V1** at `https://harvest.greenhouse.io/v1`.

**B. Are ANY V1/V2 endpoints still being used?**  
**YES — exclusively V1.** No V2 or V3 paths found in application code.

---

## Evidence

### Default base URL

```6:22:lib/integrations/providers/greenhouse/config/greenhouse-config.ts
const DEFAULT_HARVEST_BASE_URL = "https://harvest.greenhouse.io/v1";
```

Manifest declares `apiVersion: "1.0"`:

```25:28:lib/integrations/providers/greenhouse/config/manifest.ts
export const GREENHOUSE_PROVIDER_CAPABILITIES: ProviderCapabilities = {
  providerId: "greenhouse",
  displayName: "Greenhouse",
  apiVersion: "1.0",
```

### Implemented endpoints (all V1)

| Method | Path | File |
|--------|------|------|
| GET | `/users/me` | `harvest-client.ts` |
| GET | `/users?page=&per_page=` | `harvest-client.ts` |
| GET | `/jobs?page=&per_page=[&updated_after=]` | `harvest-client.ts` |
| GET | `/jobs/{id}` | `harvest-client.ts` |
| GET | `/candidates?page=&per_page=[&updated_after=]` | `harvest-client.ts` |
| GET | `/candidates/{id}` | `harvest-client.ts` |
| GET | `/applications?page=&per_page=[&updated_after=]` | `harvest-client.ts` |
| GET | `/applications/{id}` | `harvest-client.ts` |

All requests are **GET only** — no V3 write endpoints (POST/PATCH) implemented.

---

## C. Endpoint Path Compatibility with V3

| V1 path (current) | V3 equivalent (partner) | Compatible? |
|-------------------|-------------------------|-------------|
| `/v1/jobs` | `/v3/jobs` | **NO** — different path, pagination, filters |
| `/v1/candidates` | `/v3/candidates` | **NO** |
| `/v1/applications` | `/v3/applications` | **NO** |
| `/v1/users/me` | `/v3/users` (list/filter) | **NO** — V3 uses list + filters, not `/me` pattern |

V3 introduces many resources not used today (application_stages, openings, scorecards, etc.).

---

## D. Pagination Compatibility

### Current (V1)

- Query params: `page` (1-based) + `per_page` (default 100)
- Incremental filter: `updated_after` (ISO timestamp)
- `hasMore` heuristic: `items.length >= perPage` (not Link header)

```84:87:lib/integrations/providers/greenhouse/api/harvest-client.ts
    const items = JSON.parse(response.body) as T[];
    return { items, page, perPage, hasMore: items.length >= perPage };
```

### V3 requirement

- **Cursor-based pagination** via `Link` header `rel="next"`
- `cursor` must be **only** query param on subsequent requests
- `page` parameter **not supported**
- `per_page` max 500; default 100

**Verdict:** **INCOMPATIBLE.** Entire `HarvestClient.list()` and sync cursor logic must be rewritten for V3.

---

## E. Request/Response Model Compatibility

| Area | V1 models | V3 impact |
|------|-----------|-----------|
| Candidate | `GreenhouseCandidate` in `models/` | Field names/structure may differ; attachments, custom fields differ |
| Job | `GreenhouseJob` | V3 separates jobs, job_posts, openings |
| Application | `GreenhouseApplication` | V3 stage history via `application_stages` endpoint |
| User | `GreenhouseUser` via `/users/me` | V3 user list with filters |

Mappers in `lib/integrations/providers/greenhouse/mappers/` are built for **V1 webhook + Harvest shapes**, not V3 JSON.

---

## F. Implemented Endpoints Available in V3?

| Current use | V3 available? | Notes |
|-------------|---------------|-------|
| List/read jobs | Yes (`GET /v3/jobs`) | Different filters |
| List/read candidates | Yes (`GET /v3/candidates`) | Different filters |
| List/read applications | Yes (`GET /v3/applications`) | Different filters |
| `updated_after` sync | **UNKNOWN** | V3 uses `opened_at`/`closed_at` windows on some resources; verify per endpoint |
| Write-back | Not implemented | V3 has POST/PATCH for applications, candidates, etc. |

---

## G. Endpoints That Must Change

**All HarvestClient methods** require migration:

1. Base URL: `harvest.greenhouse.io/v1` → `harvest.greenhouse.io/v3`
2. Pagination: page/per_page → cursor/Link header
3. Sync cursor: store opaque cursor + initial filter set, not page number
4. Health check: replace `/users/me` with appropriate V3 user lookup
5. Import service (`harvest-import-service.ts`): rewrite pagination loops
6. Mappers: validate against V3 response schemas
7. Tests/fixtures: replace V1 fixture shapes

---

## Compatibility Issues Summary

| Issue | Severity |
|-------|----------|
| V1 base URL | **P0** — blocks partner program |
| Page-based pagination | **P0** — V3 rejects page param |
| `updated_after` on list endpoints | **P1** — verify V3 equivalent per resource |
| Response model drift | **P1** — mappers may silently break |
| `/users/me` health check | **P2** — replace with V3 pattern |
| Import maxPages cap (5) | **P2** — revisit with cursor pagination |

---

## What Can Be Tested Now (Mock)

- Connect event pipeline, webhooks, panel, employer portal — **independent of Harvest version**
- OAuth flow shape (against mock HTTP) — **not against real partner endpoints**
- V1 Harvest import — **mock only**

## What Must Wait for Sandbox

- Real V3 pagination behavior
- Real V3 response schemas
- Scope-gated 403 behavior (Site Admin requirement on list endpoints)
- Rate limit headers (`X-RateLimit-Remaining`)
