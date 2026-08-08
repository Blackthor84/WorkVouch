# Testing — ATS Integration Platform

> **Sprint:** 3A  
> **Last updated:** 2026-08-07

---

## Test Location

```
tests/integrations/ats-platform.test.ts
```

Run:

```bash
npm test -- tests/integrations/ats-platform.test.ts
```

---

## Test Layers (Sprint 3A)

| Layer | Scope | External deps |
|-------|-------|---------------|
| Unit | Platform services + MockATS | None |
| Integration | Manager orchestration | None |

Sprint 3B adds Greenhouse sandbox E2E tests.

---

## Required Env for Tests

```bash
ATS_ENABLED=true
MOCK_ATS_ENABLED=true
```

Tests set these in `beforeEach`.

---

## What Is Tested

- Provider registration
- Feature flags
- Configuration service
- Structured logging
- MockATS OAuth, sync, webhooks
- Health evaluation
- Event bus publish/subscribe/retry/DLQ
- Manual provider registration

---

## CI

Integration platform tests run with `npm test`. They do not require Supabase or Greenhouse.
