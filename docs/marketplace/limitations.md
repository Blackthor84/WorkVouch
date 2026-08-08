# Limitations (MVP)

## Scope

- **Greenhouse only** — other ATS providers not in this release
- **Read-primary** — no automatic write-back to Greenhouse candidate fields
- **Email linking** — candidates must share email with WorkVouch profile

## Scale

- In-memory rate limiting (single-instance optimal)
- In-memory DLQ until persistent DLQ migration
- Event store retention policy manual (no auto-purge in MVP)

## Features Not Included

- Bi-directional custom field sync
- Bulk historical import UI (API/cron only)
- Multi-workspace Greenhouse per employer (one connection per employer MVP)
- Real-time panel push (poll/refresh on load)

## Demo Mode

- Production demo requires explicit `CONNECT_DEMO_MODE_ENABLED=true`
- Demo scenarios are synthetic — not live Greenhouse data

## Compliance

- SOC2 alignment documented; formal audit separate from marketplace submission

## Roadmap (Post-MVP)

- Persistent DLQ (Supabase)
- Redis rate limiting
- Additional lifecycle triggers
- Enhanced marketplace analytics

See [review-checklist.md](./review-checklist.md) for reviewer expectations.
