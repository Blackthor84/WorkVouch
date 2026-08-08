# ADR-013: Testing Philosophy

> **Status:** Accepted  
> **Date:** 2026-08-07  
> **Sprint:** Operation Greenhouse — Sprint 2.9

---

## Context

The integration platform connects two systems (WorkVouch + Greenhouse) with async event processing, OAuth token management, and webhook handling. Testing must ensure reliability without requiring a live Greenhouse instance for every CI run.

---

## Decision

Adopt a **4-layer testing pyramid**:

### Layer 1: Unit Tests (MockAtsAdapter)
- All adapter logic tested against `MockAtsAdapter`
- Sync engine, automation engine, conflict resolver tested in isolation
- Run on every PR in CI
- Target: 54 unit test cases

### Layer 2: Contract Tests (Schema Validation)
- API request/response schemas validated against spec
- `AtsProvider` interface compliance verified
- Custom field names match spec
- Run on every PR in CI
- Target: 12 contract test cases

### Layer 3: Integration Tests (GH Sandbox)
- OAuth flow, webhook processing, trust export against GH sandbox
- Run on staging deploy (not every PR)
- Target: 15 integration scenarios

### Layer 4: Acceptance Tests (Demo Environment)
- Marketplace demo scenarios (8 tests)
- Run before marketplace submission
- Manual + automated

**Additional:** Failure injection tests (8), recovery tests (5), regression tests (6), load tests (5).

**Rule:** No test should require production Greenhouse credentials.

---

## Consequences

**Positive:**
- CI is fast (Layers 1–2 only; no external dependencies)
- Contract tests catch schema drift before deployment
- MockAtsAdapter enables development without GH sandbox
- Acceptance tests validate marketplace demo readiness

**Negative:**
- Integration tests depend on GH sandbox availability
- Mock may not catch all GH API edge cases
- Load tests require dedicated environment
- Test maintenance grows with each provider

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|-------------|
| E2E only (no unit tests) | Slow CI; flaky; hard to debug; GH sandbox dependency on every PR |
| Manual testing only | Doesn't scale; regression risk; marketplace submission requires automated confidence |
| Record/replay (VCR) | Fragile; GH API responses change; hard to maintain cassettes |
| Production testing | Unacceptable risk; could affect real customer data |

---

## Future Impact

- Each new provider adds contract tests + sandbox E2E tests
- Load test tooling selection (k6 recommended) in Sprint 4
- Test coverage metrics tracked but not gated (quality over quantity)

---

## Related

- [docs/integration-contract/11-testing-matrix.md](../integration-contract/11-testing-matrix.md)
- [docs/mvp/04-launch-checklist.md](../mvp/04-launch-checklist.md)
