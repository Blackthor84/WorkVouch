import type { GreenhousePanelPayload } from "./types";
import { mapLifecycleToWorkflowSteps } from "./types";
import { buildDemoExplainability } from "./explainability";
import { hiringConfidenceEngine } from "@/lib/trust/confidence";

/** Marketplace-ready demo payload for Greenhouse reviewer sandbox. */
export function buildDemoPanelPayload(externalCandidateId: string): GreenhousePanelPayload {
  const now = new Date().toISOString();

  const hiringConfidence = hiringConfidenceEngine.computeFromPanelSignals({
    trustScore: 96,
    employmentVerified: true,
    managerReferences: 2,
    coworkerReferences: 3,
    referenceCompletionPct: 100,
    referenceConsensus: "strong",
    timelineConfidenceAvg: 0.92,
    workflowCompletionPct: 100,
    dataFreshnessHours: 2,
    workflowMilestones: [
      { id: "imported", label: "Application Imported", completionPct: 0.6, occurredAt: "2026-08-01T10:00:00Z" },
      { id: "verification", label: "Verification Complete", completionPct: 0.79, occurredAt: "2026-08-02T09:00:00Z" },
      { id: "references", label: "References Complete", completionPct: 0.94, occurredAt: "2026-08-05T16:00:00Z" },
      { id: "trust", label: "Trust Updated", completionPct: 1, occurredAt: "2026-08-06T11:00:00Z" },
    ],
  });

  return {
    provider: "greenhouse",
    externalCandidateId,
    connectionId: "demo-connection",
    employerAccountId: "demo-employer",
    linkStatus: "synced",
    candidateName: "Jane Chen",
    currentStage: "Final Interview",
    trustScore: 96,
    trustBand: "Exceptional",
    hiringConfidence,
    verificationStatus: "verified",
    employmentVerified: true,
    managerReferences: 2,
    coworkerReferences: 3,
    referenceCompletionPct: 100,
    workflowStatus: mapLifecycleToWorkflowSteps("trust_updated", {
      imported: "2026-08-01T10:00:00Z",
      invited: "2026-08-01T10:05:00Z",
      account_created: "2026-08-01T14:00:00Z",
      verification_started: "2026-08-02T09:00:00Z",
      references_pending: "2026-08-03T09:00:00Z",
      references_complete: "2026-08-05T16:00:00Z",
      trust_updated: "2026-08-06T11:00:00Z",
    }),
    lastUpdated: now,
    explainability: buildDemoExplainability(96),
    employmentTimeline: [
      {
        id: "emp-1",
        employer: "Acme Corp",
        role: "Senior Software Engineer",
        startDate: "2020-03",
        endDate: "2024-06",
        verificationStatus: "verified",
        managerVerified: true,
        coworkerVerified: true,
        timelineConfidence: 0.95,
      },
      {
        id: "emp-2",
        employer: "Northwind Labs",
        role: "Software Engineer",
        startDate: "2018-01",
        endDate: "2020-02",
        verificationStatus: "verified",
        managerVerified: true,
        coworkerVerified: false,
        timelineConfidence: 0.88,
      },
    ],
    referenceSummary: {
      completed: 5,
      pending: 0,
      managers: 2,
      coworkers: 3,
      wouldRehire: "yes",
      overallConsensus: "strong",
      completionPct: 100,
    },
    hiringIntelligence: {
      averageVerificationTimeHours: 18,
      completionRatePct: 94,
      averageReferenceTimeHours: 36,
      automationEnabled: true,
      processingTimeMs: 240,
    },
    syncStatus: {
      lastSyncedAt: now,
      status: "synced",
      connectionHealthy: true,
    },
    profileUrl: "https://workvouch.com/v/demo-jane-chen",
    fullReportUrl: "https://workvouch.com/employer/candidates/demo-jane-chen",
    timelineUrl: "/integrations/greenhouse/panel?demo=1&section=timeline",
    auditUrl: "/integrations/greenhouse/panel?demo=1&section=audit",
    actions: {
      canRefresh: true,
      canReplayWorkflow: true,
      canViewTimeline: true,
      canViewAudit: true,
      canOpenFullReport: true,
      canRetrySync: false,
    },
    aiSummary:
      "Jane has 6+ years verified engineering experience across two employers. Manager and coworker references show strong consensus with high rehire intent.",
    aiSummaryGeneratedAt: now,
  };
}
