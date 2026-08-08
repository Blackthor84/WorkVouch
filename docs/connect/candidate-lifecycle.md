# Candidate Lifecycle Orchestration

When Greenhouse (or any ATS) events arrive, the **Candidate Lifecycle Engine** decides what WorkVouch should do automatically — invite, wait, request references, archive, or ignore.

This sprint builds **business workflows only**. No recruiter UI.

## Architecture

```
Provider Webhook / Import
  → Universal Event (AtsEventPipeline)
  → EventDispatcher
  → CandidateLifecycleEngine.handleEvent()
      → AutomationRuleEvaluator (rules + filters)
      → DecisionEngine (invite / wait / archive / …)
      → WorkflowEngine (execute action)
      → Invitation Queue + Lifecycle State + Event Store
  → LifecycleObservability (audit metrics)
```

## Entry Point

The engine subscribes to all universal ATS event types on the Connect runtime `EventDispatcher`:

```typescript
const runtime = getConnectApiRuntime();
runtime.lifecycle.subscribe(); // called automatically in createConnectRuntime()
```

Manual invocation (replay, testing):

```typescript
await runtime.lifecycle.handleEvent(integrationEvent);
await runtime.lifecycle.processScheduledInvitations();
```

## Components

| Component | File | Role |
|-----------|------|------|
| `CandidateLifecycleEngine` | `orchestration/candidate-lifecycle-engine.ts` | Orchestrates the full pipeline |
| `AutomationRuleEvaluator` | `orchestration/automation-rule-evaluator.ts` | Evaluates employer automation rules |
| `DecisionEngine` | `orchestration/decision-engine.ts` | Maps evaluation → decision + action |
| `WorkflowEngine` | `orchestration/workflow-engine.ts` | Executes workflow actions |
| `LifecycleObservability` | `orchestration/lifecycle-observability.ts` | Metrics and audit trail |

## Configuration

Automation preferences are stored on the connection under `metadata.sync_preferences.automation`:

```json
{
  "automation": {
    "auto_invite_enabled": true,
    "auto_invite_trigger": "final_interview",
    "auto_invite_delay_hours": 0,
    "job_filter_mode": "all",
    "job_filter_ids": [],
    "department_filter_mode": "all",
    "location_filter_mode": "all",
    "employment_type_filter_mode": "all"
  }
}
```

See [automation-rules.md](./automation-rules.md) for full rule reference.

## Business Events

Workflow actions emit standard business events to the Connect event store:

| Event | When |
|-------|------|
| `workflow.invitation.sent` | Invitation queued or sent |
| `workflow.verification.requested` | Employment verification started |
| `workflow.reference.requested` | Reference collection started |
| `workflow.completed` | Trust refresh or workflow complete |
| `workflow.cancelled` | Archive or invitation cancelled |

## Observability

```typescript
runtime.lifecycleObservability.getSnapshot();
// { automationTriggers, decisionsMade, workflowsSucceeded, workflowsFailed, averageExecutionMs }
```

Every orchestration run records: automation trigger, rule matched, decision, action, workflow result, and execution time.

## Protected Systems

The lifecycle engine is **additive**. It does **not** modify:

- Trust Engine
- Verification Engine
- Billing
- Authentication
- Existing dashboards

Invitations are queued internally. Verification and reference actions emit business events for downstream consumers to act on.

## Database Tables

Migration `20260808150000_connect_lifecycle_orchestration.sql`:

- `connect_lifecycle_state` — per-candidate state machine position
- `connect_invitation_queue` — internal invitation queue
- `connect_workflow_log` — orchestration audit trail (future Supabase persistence)

## Related Docs

- [workflow-engine.md](./workflow-engine.md)
- [automation-rules.md](./automation-rules.md)
- [state-machine.md](./state-machine.md)
- [webhooks.md](./webhooks.md)
