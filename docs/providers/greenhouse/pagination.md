# Harvest V3 Pagination (WorkVouch Connect)

Harvest V3 list endpoints use **cursor pagination** via the `Link` response header.

## Rules

1. First request: include filters and `per_page` (1–500, default 100).
2. Read `Link` header for `rel="next"`.
3. Follow the next URL until no `next` link remains.
4. When using `cursor`, it must be the **only** query parameter.

## WorkVouch architecture

Two cursor layers:

| Layer | Purpose |
|---|---|
| **Greenhouse API cursor** | Opaque URL in `Link` header; stored in `providerCursor.jobsNextUrl`, etc. |
| **WorkVouch Sync Cursor** | Incremental sync timestamps, checkpoints, replay — unchanged Sprint 6A design |

Parser: `lib/integrations/providers/greenhouse/api/link-pagination.ts`

## Import limits

`maxPages` on import truncates pagination early and sets `paginationTruncated: true` on the import result.
