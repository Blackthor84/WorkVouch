/** WorkVouch business events emitted by the lifecycle orchestration engine. */
export const WORKFLOW_EVENT_TYPES = {
  VerificationRequested: "workflow.verification.requested",
  VerificationStarted: "workflow.verification.started",
  ReferenceRequested: "workflow.reference.requested",
  ReferenceReceived: "workflow.reference.received",
  InvitationSent: "workflow.invitation.sent",
  InvitationAccepted: "workflow.invitation.accepted",
  WorkflowCompleted: "workflow.completed",
  WorkflowCancelled: "workflow.cancelled",
} as const;

export type WorkflowEventType = (typeof WORKFLOW_EVENT_TYPES)[keyof typeof WORKFLOW_EVENT_TYPES];

export const ALL_WORKFLOW_EVENT_TYPES: WorkflowEventType[] = Object.values(WORKFLOW_EVENT_TYPES);
