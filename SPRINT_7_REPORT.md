# Sprint 7 Report — Candidate Lifecycle Orchestration

**Operation:** GREENHOUSE  
**Sprint:** 7  
**Phase:** Candidate Lifecycle Orchestration  
**Connect Platform Version:** 1.0.0  
**Date:** August 2026

---

## Summary

Sprint 7 builds the **Candidate Lifecycle Engine** — the orchestration layer that decides what WorkVouch should do when ATS events arrive from Greenhouse. When a candidate reaches a configured stage, WorkVouch automatically invites, waits, requests references, archives, or ignores — with every decision logged and replayable.

No recruiter UI was built. No protected systems (Trust Engine, Verification Engine, Billing, Auth, dashboards) were modified.

---

## Files Created

### Orchestration Core
| File | Purpose |
|------|---------|
| `lib/integrations/connect/orchestration/candidate-lifecycle-engine.ts` | Main orchestrator — subscribes to ATS events |
| `lib/integrations/connect/orchestration/automation-rule-evaluator.ts` | Rule + filter evaluation |
| `lib/integrations/connect/orchestration/decision-engine.ts` | Evaluation → decision + action |
| `lib/integrations/connect/orchestration/workflow-engine.ts` | Action execution + business events |
| `lib/integrations/connect/orchestration/invitation-queue.ts` | In-memory queue helper |
| `lib/integrations/connect/orchestration/lifecycle-observability.ts` | Metrics and audit records |
| `lib/integrations/connect/orchestration/types.ts` | Lifecycle states, decisions, queue types |
| `lib/integrations/connect/orchestration/workflow-event-types.ts` | Standard business event types |
| `lib/integrations/connect/orchestration/index.ts` | Module exports |

### Persistence
| File | Purpose |
|------|---------|
| `persistence/repositories/invitation-queue-repository.ts` | Invitation queue interface |
| `persistence/repositories/lifecycle-state-repository.ts` | Lifecycle state interface |
| `persistence/in-memory/in-memory-invitation-queue-repository.ts` | In-memory invitation queue |
| `persistence/in-memory/in-memory-lifecycle-state-repository.ts` | In-memory lifecycle state |

### Database
| File | Purpose |
|------|---------|
| `supabase/migrations/20260808150000_connect_lifecycle_orchestration.sql` | lifecycle_state, invitation_queue, workflow_log tables |

### Tests
| File | Tests |
|------|-------|
| `tests/integrations/connect-sprint7-lifecycle.test.ts` | 8 tests |

### Documentation
| File | Purpose |
|------|---------|
| `docs/connect/candidate-lifecycle.md` | Orchestration overview |
| `docs/connect/workflow-engine.md` | Workflow actions reference |
| `docs/connect/automation-rules.md` | Employer rule configuration |
| `docs/connect/state-machine.md` | Lifecycle state transitions |

---

## Files Modified

| File | Change |
|------|--------|
| `lib/integrations/connect/connect-runtime.ts` | Wired lifecycle engine + observability |
| `lib/integrations/connect/index.ts` | Export orchestration module |
| `lib/integrations/connect/persistence/index.ts` | Export new repositories |
| `lib/integrations/connect/connection/types.ts` | Added `metadata` to ConnectionSummary |
| `lib/integrations/connect/connection/connection-manager.ts` | Pass metadata in getConnection |

---

## Rules Supported

| Rule | Status |
|------|--------|
| Invite after Application | ✅ |
| Invite after Phone Screen | ✅ |
| Invite after Final Interview | ✅ (default) |
| Invite after Offer | ✅ |
| Invite after Hire | ✅ |
| Manual Only | ✅ |
| Job Filters (all / selected / excluded) | ✅ |
| Department Filters | ✅ |
| Location Filters (country ISO-2) | ✅ |
| Employment Type Filters | ✅ |
| Auto-invite delay (hours) | ✅ |
| Duplicate invitation prevention | ✅ |

---

## Workflow Coverage

| Action | Implemented | Notes |
|--------|-------------|-------|
| Invite Candidate | ✅ | Immediate + scheduled |
| Send Reminder | ✅ | Requires existing sent invitation |
| Cancel Invitation | ✅ | Cancels pending/scheduled |
| Archive | ✅ | On reject/withdraw |
| Create Verification | ✅ | Emits business event only |
| Request References | ✅ | On offer accepted |
| Refresh Trust | ✅ | Emits business event only |
| Queue AI Summary | ✅ | Placeholder — no AI |
| Wait | ✅ | Manual-only mode |
| Ignore | ✅ | No matching rule / already invited |

---

## State Coverage

| State | Defined | Set by Engine |
|-------|---------|---------------|
| imported | ✅ | ✅ |
| pending | ✅ | ✅ |
| eligible | ✅ | ✅ |
| invited | ✅ | ✅ |
| account_created | ✅ | Future consumer |
| employment_verification | ✅ | ✅ |
| reference_collection | ✅ | ✅ |
| reference_complete | ✅ | Future consumer |
| verification_complete | ✅ | Future consumer |
| trust_updated | ✅ | Future consumer |
| archived | ✅ | ✅ |
| cancelled | ✅ | ✅ |

---

## Automation Coverage

| Capability | Status |
|------------|--------|
| Provider event → Universal event | ✅ (Sprint 6 webhooks) |
| Rule evaluation | ✅ |
| Decision mapping | ✅ |
| Workflow execution | ✅ |
| Event store append | ✅ |
| Invitation queue (pending/scheduled/sent/failed/retry/cancelled/expired) | ✅ |
| Observability (trigger, decision, rule, duration, result) | ✅ |
| Event bus subscription (all ATS event types) | ✅ |
| Configurable per connection | ✅ |

---

## Business Events

| Event | Emitted |
|-------|---------|
| `workflow.verification.requested` | ✅ |
| `workflow.verification.started` | Defined (future) |
| `workflow.reference.requested` | ✅ |
| `workflow.reference.received` | Defined (future) |
| `workflow.invitation.sent` | ✅ |
| `workflow.invitation.accepted` | Defined (future) |
| `workflow.completed` | ✅ |
| `workflow.cancelled` | ✅ |

---

## Performance

| Metric | Result |
|--------|--------|
| Sprint 7 unit tests | 8/8 passing |
| Full integration suite | 103/103 passing |
| Orchestration latency (in-memory) | ~1–2 ms per event (test env) |
| Average execution (observability) | Tracked via `lifecycleObservability.getSnapshot()` |

Orchestration runs synchronously within the event dispatcher handler. No external API calls in the hot path — invitations are queued, not sent via email in this sprint.

---

## Architecture Review

### Strengths

1. **Clean separation** — Rule evaluation, decision, and execution are three distinct classes
2. **Event-driven** — Subscribes to existing EventDispatcher; no changes to webhook processor
3. **Replayable** — All workflow actions append to Connect event store with idempotency keys
4. **Auditable** — LifecycleObservability records every trigger with correlation ID
5. **Additive** — Zero changes to Trust, Verification, Billing, Auth, or dashboards
6. **Provider-agnostic** — Rules operate on universal events, not Greenhouse-specific payloads

### Event Flow

```
Greenhouse Webhook
  → WebhookService → GreenhouseWebhookProcessor
  → AtsEventPipeline.publish()
  → EventDispatcher
  → CandidateLifecycleEngine.handleEvent()
  → AutomationRuleEvaluator → DecisionEngine → WorkflowEngine
  → InvitationQueue + LifecycleState + EventStore
  → LifecycleObservability
```

### Gaps

1. **Supabase repositories** for invitation queue and lifecycle state not yet implemented (in-memory only in runtime, even with Supabase client)
2. **Actual email delivery** not wired — invitations are queued/marked sent internally
3. **Future state transitions** (`account_created`, `reference_complete`, etc.) await downstream consumers
4. **Workflow log persistence** to `connect_workflow_log` table not yet wired (in-memory observability only)
5. **Cron/scheduler** for `processScheduledInvitations()` not deployed

---

## Remaining Work

| Item | Priority |
|------|----------|
| Supabase invitation queue + lifecycle state repositories | High |
| Persist observability to `connect_workflow_log` | Medium |
| Background job for scheduled invitations | High |
| Wire invitation delivery to email/notification service | High |
| Recruiter UI for automation configuration | Medium (separate sprint) |
| Handlers for `InvitationAccepted`, `ReferenceReceived`, `VerificationStarted` | Medium |
| Lever/other provider lifecycle parity | Low (provider-agnostic core ready) |

---

## Test Coverage

| Area | Tests |
|------|-------|
| Rule evaluation (final interview trigger) | ✅ |
| Manual-only decision | ✅ |
| Auto-invite on stage change | ✅ |
| Job filter blocking | ✅ |
| Archive on rejection | ✅ |
| Duplicate invitation skip | ✅ |
| Observability metrics | ✅ |
| Scheduled invitation (delay) | ✅ |

---

## Final Review

**Can an employer configure WorkVouch once and have every future Greenhouse candidate follow the correct workflow automatically?**

### YES — with caveats

An employer can set automation preferences on their Greenhouse connection (`metadata.sync_preferences.automation`) once. Every subsequent webhook event for that connection is evaluated against those rules automatically:

- Stage-based triggers (application, phone screen, final interview, offer, hire)
- Job, department, location, and employment type filters
- Manual-only mode for full recruiter control
- Automatic archive on reject/withdraw
- Reference request on offer accepted
- Verification request on hire

Every decision is logged with correlation ID, rule matched, and execution time. Workflows append to the Connect event store and are replayable via existing replay infrastructure.

**Caveats for production:**

1. Invitation queue uses in-memory persistence until Supabase repos ship
2. Invitations are queued, not delivered via email yet
3. Scheduled invitations require a background worker calling `processScheduledInvitations()`

For supported Greenhouse events with automation enabled, **no manual intervention is required** in the orchestration layer.

---

## Protected Systems — Verification

| System | Modified |
|--------|----------|
| Trust Engine | ❌ No |
| Verification Engine | ❌ No |
| Billing | ❌ No |
| Authentication | ❌ No |
| Existing dashboards | ❌ No |

All changes are additive under `lib/integrations/connect/orchestration/`.
