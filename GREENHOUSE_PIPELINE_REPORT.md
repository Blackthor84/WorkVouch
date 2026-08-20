# GREENHOUSE PIPELINE REPORT

**Sprint:** 3B-2 — Event Translation & Mapping  
**Date:** 2026-08-08  
**Status:** Complete

---

## Executive Summary

Sprint 3B-2 delivers the translation layer connecting Greenhouse webhook payloads to the WorkVouch ATS Event Bus. Greenhouse-specific payloads are mapped to universal ATS models, validated, published to the in-memory event bus, and consumed by a mock consumer with full structured logging. Zero persistence, zero UI, zero sync.

**Readiness Score: 94 / 100**

---

## Pipeline Diagram

```
Greenhouse Webhook Payload (JSON)
        ↓
parseGreenhouseWebhook()          [greenhouse/mappers/webhookMapper]
        ↓
routeGreenhouseWebhook()          [action → universal event type]
        ↓
Provider Mapper                   [candidate/job/application/etc.]
        ↓
Universal ATS Model               [core/models/]
        ↓
EventValidator                    [core/validation/]
        ↓
AtsEventPipeline.publish()        [core/pipeline/]
        ↓
EventDispatcher (Event Bus)       [events/]
        ↓
MockEventConsumer                 [core/consumers/]
        ↓
StructuredLoggingService          [logging/]
```

---

## Files Created

### Universal Models (`lib/integrations/core/models/`)

| File | Model |
|------|-------|
| `Candidate.ts` | `AtsCandidate` |
| `Job.ts` | `AtsJob` |
| `Application.ts` | `AtsApplication` |
| `Company.ts` | `AtsCompany` |
| `Employer.ts` | `AtsEmployer` |
| `WebhookEvent.ts` | `AtsWebhookEvent` |
| `TrustStatus.ts` | `TrustStatus` |
| `VerificationStatus.ts` | `VerificationStatus` |

### Event Types & Pipeline (`lib/integrations/core/`)

| Path | Purpose |
|------|---------|
| `events/ats-event-types.ts` | 12 standard ATS event types |
| `validation/event-validator.ts` | Entity + context validation |
| `validation/validation-types.ts` | Typed error codes |
| `pipeline/ats-event-pipeline.ts` | Publish universal events to bus |
| `consumers/mock-event-consumer.ts` | In-memory test consumer |

### Greenhouse Mappers (`lib/integrations/providers/greenhouse/mappers/`)

| File | Purpose |
|------|---------|
| `sharedMapper.ts` | ID, email, name utilities |
| `statusMapper.ts` | GH stage → ApplicationStatus |
| `customFieldMapper.ts` | Custom field extraction |
| `candidateMapper.ts` | Candidate translation |
| `jobMapper.ts` | Job translation |
| `applicationMapper.ts` | Application/offer translation |
| `companyMapper.ts` | Company translation |
| `userMapper.ts` | User → employer context |
| `webhookMapper.ts` | Webhook routing + envelope |

### Greenhouse Models & Services

| Path | Purpose |
|------|---------|
| `models/index.ts` | Typed Greenhouse payloads |
| `services/event-translator.ts` | Translation orchestrator |

### Fixtures (`fixtures/greenhouse/`)

| File | Action |
|------|--------|
| `candidate-created.json` | candidate_created |
| `candidate-updated.json` | candidate_updated |
| `job-created.json` | job_created |
| `application-created.json` | application_created |
| `offer-created.json` | offer_created |
| `offer-accepted.json` | offer_accepted |
| `candidate-hired.json` | hire_candidate |
| `candidate-rejected.json` | reject_candidate |
| `webhook-example.json` | application_updated |

### Tests & Documentation

| File | Purpose |
|------|---------|
| `tests/integrations/greenhouse-pipeline.test.ts` | 17 contract tests |
| `docs/providers/greenhouse/event-pipeline.md` | Pipeline architecture |
| `docs/providers/greenhouse/mapping-guide.md` | Mapper reference |
| `docs/providers/greenhouse/payload-reference.md` | Payload shapes |
| `docs/providers/greenhouse/validation-rules.md` | Validation rules |

---

## Files Modified (Additive)

| File | Change |
|------|--------|
| `lib/integrations/core/index.ts` | Export models, events, validation, pipeline, consumers |
| `lib/integrations/mappings/index.ts` | Re-export universal model types |
| `lib/integrations/providers/greenhouse/index.ts` | Export models, mappers, services |

---

## Mapping Coverage

| Greenhouse Entity | Universal Model | Mapper | Status |
|-------------------|-----------------|--------|--------|
| Candidate | `AtsCandidate` | candidateMapper | ✅ |
| Job | `AtsJob` | jobMapper | ✅ |
| Application | `AtsApplication` | applicationMapper | ✅ |
| Offer | `AtsApplication` | applicationMapper | ✅ |
| Company | `AtsCompany` | companyMapper | ✅ |
| User | `AtsEmployer` | userMapper | ✅ |
| Webhook envelope | `AtsWebhookEvent` | webhookMapper | ✅ |
| Custom fields | metadata | customFieldMapper | ✅ |
| Stage/status | `ApplicationStatus` | statusMapper | ✅ |

---

## Validation Coverage

| Rule | Implemented |
|------|-------------|
| Required fields | ✅ |
| Unknown enums | ✅ |
| Invalid statuses | ✅ |
| Missing IDs | ✅ |
| Malformed payloads | ✅ |
| Duplicate events | ✅ |
| Out-of-order events | ✅ |
| US location state requirement | ✅ |
| Typed error codes | ✅ |

---

## Events Supported

| Universal Event | Greenhouse Trigger |
|-----------------|-------------------|
| `ats.candidate.created` | candidate_created |
| `ats.candidate.updated` | candidate_updated |
| `ats.candidate.moved` | application_updated |
| `ats.application.created` | application_created |
| `ats.job.created` | job_created |
| `ats.job.updated` | job_updated |
| `ats.offer.created` | offer_created |
| `ats.offer.accepted` | offer_accepted |
| `ats.offer.rejected` | offer_rejected |
| `ats.candidate.hired` | hire_candidate |
| `ats.candidate.rejected` | reject_candidate |
| `ats.candidate.withdrawn` | candidate_withdrawn |

---

## Fixtures

9 realistic Greenhouse webhook fixtures based on integration contract documentation. All marked with `"_fixture": true`.

---

## Tests Passing

```
✓ greenhouse-pipeline.test.ts (17 tests)
✓ greenhouse-provider.test.ts (14 tests)
✓ ats-platform.test.ts (11 tests)

Total: 42 passed
```

Contract tests verify full chain: fixture → mapper → universal model → event bus → consumer → logs.

---

## Regression Check

| Check | Result |
|-------|--------|
| Sprint 3A platform tests | ✅ 11 passing |
| Sprint 3B-1 Greenhouse provider tests | ✅ 14 passing |
| Existing WorkVouch code modified | ❌ None |
| Database migrations | ❌ None |
| UI changes | ❌ None |

---

## Architecture Review

### Engineering Rule Compliance

| Rule | Status |
|------|--------|
| No provider logic outside provider folder | ✅ |
| Platform only understands universal models | ✅ |
| Same event bus for all providers | ✅ |
| No persistence | ✅ |
| Structured logging on every event | ✅ |

### Lever Copy-Pattern Review

**Can Lever be implemented by replacing only provider/, mappers/, models/, fixtures/ without changing the ATS Platform?**

**YES.**

Lever implementation requires:

1. `providers/lever/models/` — Lever-specific payload types
2. `providers/lever/mappers/` — Lever → universal model mappers
3. `providers/lever/fixtures/` — Lever webhook fixtures
4. `providers/lever/services/event-translator.ts` — Lever translation orchestrator

Platform components reused unchanged:

- `core/models/` — universal models
- `core/events/` — standard event types
- `core/validation/` — event validator
- `core/pipeline/` — AtsEventPipeline
- `core/consumers/` — MockEventConsumer
- `events/EventDispatcher` — event bus

---

## Remaining Work

| Sprint | Deliverable |
|--------|-------------|
| 3B-3 | Live webhook ingestion + signature validation |
| 3B-4 | Candidate/job/application sync |
| 3B-5 | Employer UI + connection dashboard |
| Future | Database event persistence (`ats_events`) |
| Future | Real event consumers (Trust Engine, Verification) |

---

## Commands

```bash
npx vitest run tests/integrations/greenhouse-pipeline.test.ts
npx vitest run tests/integrations/
```

---

*Generated for Sprint 3B-2 — Operation Greenhouse*
