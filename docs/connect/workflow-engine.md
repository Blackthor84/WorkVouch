# Workflow Engine

The **WorkflowEngine** executes lifecycle actions after the Decision Engine selects an outcome.

## Supported Actions

| Action | Description | Lifecycle State Change |
|--------|-------------|------------------------|
| `invite_candidate` | Enqueue invitation (immediate or scheduled) | `eligible` → `invited` |
| `send_reminder` | Remind on existing sent invitation | No change |
| `cancel_invitation` | Cancel pending/scheduled invitations | → `cancelled` |
| `archive` | Archive rejected/withdrawn candidate | → `archived` |
| `create_verification` | Start employment verification workflow | → `employment_verification` |
| `request_references` | Start reference collection | → `reference_collection` |
| `refresh_trust` | Emit trust refresh event | No change |
| `queue_ai_summary` | Placeholder for future AI summary | No change |
| `wait` | No action — manual mode | → `pending` |
| `ignore` | No action — rule not matched | No change |

## Execution Flow

```typescript
const result = await workflowEngine.execute({
  connectionId: "conn-uuid",
  employerAccountId: "employer-1",
  correlationId: "corr-abc",
  externalCandidateId: "cand-123",
  candidateEmail: "jane@example.com",
  action: "invite_candidate",
  decision: "invite",
  delayMs: 3600000, // optional — schedules invitation
  provider: "greenhouse",
});
```

Returns `WorkflowExecutionResult`:

```typescript
{
  action: "invite_candidate",
  success: true,
  lifecycleState: "invited",
  businessEvent: "workflow.invitation.sent",
  invitationId: "uuid",
  durationMs: 12
}
```

## Invitation Queue Integration

When `invite_candidate` runs:

1. **No delay** — status `pending`, immediately marked `sent`, state → `invited`
2. **With delay** — status `scheduled`, state → `eligible`, processed later via `processScheduledInvitations()`

Queue statuses: `pending`, `scheduled`, `sent`, `failed`, `retry`, `cancelled`, `expired`.

Retry policy: up to 3 attempts before `failed`.

## Event Store Integration

When an `eventStore` is wired (production runtime), business events are appended:

```typescript
await eventStore.appendEvent({
  aggregateType: "candidate",
  aggregateId: externalCandidateId,
  eventType: "workflow.invitation.sent",
  idempotencyKey: `workflow:workflow.invitation.sent:${candidateId}:${correlationId}`,
  // ...
});
```

## Decision → Action Mapping

| Decision | Default Action |
|----------|----------------|
| `invite` | `invite_candidate` (or `create_verification` on hire) |
| `wait` | `wait` |
| `request_references` | `request_references` |
| `archive` | `archive` |
| `ignore` | `ignore` |

Special cases handled by `DecisionEngine`:

- **CandidateRejected / CandidateWithdrawn** → `archive`
- **OfferAccepted** → `request_references`
- **CandidateHired** → `create_verification`
- **Already invited** → `ignore`

## Scheduled Processing

```typescript
const processed = await runtime.lifecycle.processScheduledInvitations();
// Returns count of due scheduled invitations marked sent
```

Run on a cron or background worker in production.

## Error Handling

Workflow failures return `success: false` with an `error` message. The lifecycle state is not advanced on failure. Observability records `workflowResult: "failure"`.
