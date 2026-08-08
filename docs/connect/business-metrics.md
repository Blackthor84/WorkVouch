# Business Metrics Reference

All metrics derive from Connect event store event types. No duplicate event sources.

## Core Metrics

| Metric | Key | Description |
|--------|-----|-------------|
| Import → Invitation time | `core.importToInvitationMs` | Avg ms from candidate import to invitation sent |
| Invitation acceptance rate | `core.invitationAcceptanceRate` | Accepted / invited (0–1) |
| Invitation decline rate | `core.invitationDeclineRate` | Cancelled / invited (0–1) |
| Verification completion rate | `core.verificationCompletionRate` | Completed / started (0–1) |
| Average verification time | `core.averageVerificationMs` | Avg ms verification started → completed |
| Reference completion rate | `core.referenceCompletionRate` | Completed / requested (0–1) |
| Average reference response time | `core.averageReferenceResponseMs` | Avg ms reference requested → received |
| ATS event → workflow completion | `core.atsEventToWorkflowCompletionMs` | End-to-end processing time |
| Automation success rate | `core.automationSuccessRate` | Successful automations / total triggers |
| Workflow failure rate | `core.workflowFailureRate` | Failed workflows / total decisions |
| Average processing time | `core.averageProcessingMs` | Import → final stage |

## Advanced Metrics

| Metric | Key | Description |
|--------|-----|-------------|
| Import success % | `advanced.importSuccessRate` | Successful sync imports |
| Automation trigger % | `advanced.automationTriggerRate` | Candidates with automated invite |
| Replay rate | `advanced.replayRate` | Replayed events / total events |
| Manual override % | `advanced.manualOverrideRate` | Manual-only decisions / events |
| Avg candidate processing time | `advanced.averageCandidateProcessingMs` | Per-candidate funnel duration |
| Avg employer setup time | `advanced.averageEmployerSetupMs` | Connection → first workflow |
| Sync success % | `advanced.syncSuccessRate` | Successful sync operations |
| Recovery success % | `advanced.recoverySuccessRate` | Webhook delivery success rate |
| Queue wait time | `advanced.averageQueueWaitMs` | Scheduled → sent invitation delay |

## Funnel Counts

`funnelCounts` maps each funnel stage to the number of candidates reaching that stage in the period.

## Event Type Mapping

| Stage | Event Types |
|-------|-------------|
| candidate_imported | `ats.candidate.created`, `ats.application.created` |
| invitation_sent | `workflow.invitation.sent` |
| invitation_accepted | `workflow.invitation.accepted` |
| verification_started | `workflow.verification.started`, `workflow.verification.requested` |
| references_requested | `workflow.reference.requested` |
| references_completed | `workflow.reference.received` |
| trust_updated | `workflow.completed` (action: refresh_trust) |
| workflow_completed | `workflow.completed` |

## Periods

| Period | Range |
|--------|-------|
| `day` | Last 24 hours |
| `7d` | Last 7 days |
| `30d` | Last 30 days |
| `90d` | Last 90 days |
| `ytd` | Year to date |
| `lifetime` | All time |
