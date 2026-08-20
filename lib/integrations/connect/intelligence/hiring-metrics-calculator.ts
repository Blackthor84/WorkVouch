import type { ConnectStoredEvent } from "../persistence/types";
import type { LifecycleObservability } from "../orchestration/lifecycle-observability";
import type { WebhookMetrics } from "../webhooks/webhook-metrics";
import {
  type CandidateFunnelTimeline,
  type CoreHiringMetrics,
  type AdvancedHiringMetrics,
  type RoiHiringMetrics,
  type HiringMetricsBundle,
  type HiringFunnelStage,
  HIRING_FUNNEL_STAGES,
  eventTypeToStage,
  emptyMetricsBundle,
  ROI_CONSTANTS,
} from "./types";
import { WORKFLOW_EVENT_TYPES } from "../orchestration/workflow-event-types";
import { nowIso } from "../../utils/correlation";

export interface CalculatorContext {
  lifecycleObservability?: LifecycleObservability;
  webhookMetrics?: WebhookMetrics;
  syncSuccessCount?: number;
  syncFailureCount?: number;
  replayCount?: number;
  queueWaitSamplesMs?: number[];
}

/** Derives business metrics from immutable Connect event store history. */
export class HiringMetricsCalculator {
  buildCandidateTimelines(events: ConnectStoredEvent[]): CandidateFunnelTimeline[] {
    const byCandidate = new Map<string, ConnectStoredEvent[]>();

    for (const event of events) {
      const candidateId = this.resolveCandidateId(event);
      if (!candidateId) continue;
      const list = byCandidate.get(candidateId) ?? [];
      list.push(event);
      byCandidate.set(candidateId, list);
    }

    const timelines: CandidateFunnelTimeline[] = [];

    for (const [candidateId, candidateEvents] of byCandidate) {
      const sorted = [...candidateEvents].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
      const stages: Partial<Record<HiringFunnelStage, string>> = {};
      let jobId: string | undefined;
      let department: string | undefined;
      let connectionId: string | undefined;
      let provider = sorted[0]?.provider;
      let automated = false;

      for (const event of sorted) {
        connectionId = event.connectionId ?? connectionId;
        provider = event.provider ?? provider;
        jobId = this.extractJobId(event) ?? jobId;
        department = this.extractDepartment(event) ?? department;

        const stage = eventTypeToStage(event.eventType, event.payload);
        if (stage && !stages[stage]) {
          stages[stage] = event.occurredAt;
        }

        if (event.eventType === WORKFLOW_EVENT_TYPES.InvitationSent) {
          automated = Boolean(event.metadata?.source === "automation" || event.payload?.scheduledAt !== undefined);
          if (!automated && event.payload?.source === "automation") automated = true;
          if (event.payload && typeof event.payload === "object" && "source" in (event.payload as object)) {
            automated = (event.payload as { source?: string }).source === "automation";
          }
        }

        if (event.providerEventType === "lifecycle_orchestration") {
          automated = true;
        }
      }

      const stageTimings = this.computeStageTimings(candidateId, stages);
      const first = stages.candidate_imported;
      const last = stages.workflow_completed ?? stages.trust_updated ?? stages.references_completed;
      const totalProcessingMs =
        first && last ? new Date(last).getTime() - new Date(first).getTime() : undefined;

      timelines.push({
        candidateId,
        jobId,
        department,
        connectionId,
        provider,
        stages,
        stageTimings,
        totalProcessingMs,
        automated,
      });
    }

    return timelines;
  }

  calculate(
    events: ConnectStoredEvent[],
    context: CalculatorContext = {}
  ): HiringMetricsBundle {
    if (events.length === 0) {
      return emptyMetricsBundle();
    }

    const timelines = this.buildCandidateTimelines(events);
    const funnelCounts = this.countFunnelStages(timelines);
    const core = this.calculateCoreMetrics(timelines, events, context);
    const advanced = this.calculateAdvancedMetrics(timelines, events, context);
    const roi = this.calculateRoiMetrics(timelines, core, advanced);

    return {
      core,
      advanced,
      roi,
      funnelCounts,
      sampleSize: timelines.length,
      calculatedAt: nowIso(),
    };
  }

  private computeStageTimings(
    candidateId: string,
    stages: Partial<Record<HiringFunnelStage, string>>
  ) {
    const timings = [];
    for (let i = 0; i < HIRING_FUNNEL_STAGES.length - 1; i++) {
      const from = HIRING_FUNNEL_STAGES[i];
      const to = HIRING_FUNNEL_STAGES[i + 1];
      const fromAt = stages[from];
      const toAt = stages[to];
      if (fromAt && toAt) {
        timings.push({
          from,
          to,
          durationMs: new Date(toAt).getTime() - new Date(fromAt).getTime(),
          candidateId,
        });
      }
    }
    return timings;
  }

  private countFunnelStages(timelines: CandidateFunnelTimeline[]) {
    const counts: Partial<Record<HiringFunnelStage, number>> = {};
    for (const t of timelines) {
      for (const stage of HIRING_FUNNEL_STAGES) {
        if (t.stages[stage]) {
          counts[stage] = (counts[stage] ?? 0) + 1;
        }
      }
    }
    return counts;
  }

  private calculateCoreMetrics(
    timelines: CandidateFunnelTimeline[],
    events: ConnectStoredEvent[],
    context: CalculatorContext
  ): CoreHiringMetrics {
    const importToInvite = timelines
      .flatMap((t) => t.stageTimings.filter((s) => s.from === "candidate_imported" && s.to === "invitation_sent"))
      .map((s) => s.durationMs);

    const invited = timelines.filter((t) => t.stages.invitation_sent).length;
    const accepted = timelines.filter((t) => t.stages.invitation_accepted).length;
    const declined = events.filter((e) => e.eventType === WORKFLOW_EVENT_TYPES.WorkflowCancelled).length;

    const verificationStarted = timelines.filter((t) => t.stages.verification_started).length;
    const verificationCompleted = timelines.filter((t) => t.stages.verification_completed).length;

    const verificationDurations = timelines
      .flatMap((t) =>
        t.stageTimings.filter((s) => s.from === "verification_started" && s.to === "verification_completed")
      )
      .map((s) => s.durationMs);

    const refsRequested = timelines.filter((t) => t.stages.references_requested).length;
    const refsCompleted = timelines.filter((t) => t.stages.references_completed).length;

    const refDurations = timelines
      .flatMap((t) =>
        t.stageTimings.filter((s) => s.from === "references_requested" && s.to === "references_completed")
      )
      .map((s) => s.durationMs);

    const atsToComplete = timelines
      .filter((t) => t.stages.candidate_imported && t.stages.workflow_completed)
      .map(
        (t) =>
          new Date(t.stages.workflow_completed!).getTime() - new Date(t.stages.candidate_imported!).getTime()
      );

    const lifecycle = context.lifecycleObservability?.getSnapshot();
    const automationSuccessRate =
      lifecycle && lifecycle.decisionsMade > 0
        ? lifecycle.workflowsSucceeded / lifecycle.decisionsMade
        : timelines.filter((t) => t.automated && t.stages.invitation_sent).length /
            Math.max(invited, 1);

    const workflowFailureRate =
      lifecycle && lifecycle.decisionsMade > 0
        ? lifecycle.workflowsFailed / lifecycle.decisionsMade
        : 0;

    const processingTimes = timelines
      .map((t) => t.totalProcessingMs)
      .filter((ms): ms is number => ms !== undefined);

    return {
      importToInvitationMs: average(importToInvite),
      invitationAcceptanceRate: invited > 0 ? accepted / invited : 0,
      invitationDeclineRate: invited > 0 ? declined / invited : 0,
      verificationCompletionRate: verificationStarted > 0 ? verificationCompleted / verificationStarted : 0,
      averageVerificationMs: average(verificationDurations),
      referenceCompletionRate: refsRequested > 0 ? refsCompleted / refsRequested : 0,
      averageReferenceResponseMs: average(refDurations),
      atsEventToWorkflowCompletionMs: average(atsToComplete),
      automationSuccessRate,
      workflowFailureRate,
      averageProcessingMs: average(processingTimes),
    };
  }

  private calculateAdvancedMetrics(
    timelines: CandidateFunnelTimeline[],
    events: ConnectStoredEvent[],
    context: CalculatorContext
  ): AdvancedHiringMetrics {
    const imported = timelines.filter((t) => t.stages.candidate_imported).length;
    const syncTotal = (context.syncSuccessCount ?? 0) + (context.syncFailureCount ?? 0);
    const webhook = context.webhookMetrics?.getSnapshot();

    const automatedInvites = timelines.filter((t) => t.automated).length;
    const manualOverrides = events.filter(
      (e) =>
        e.providerEventType === "lifecycle_orchestration" &&
        (e.payload as { action?: string })?.action === "wait"
    ).length;

    const replayTotal = context.replayCount ?? 0;
    const setupTimes = this.estimateEmployerSetupTimes(events);

    return {
      importSuccessRate: syncTotal > 0 ? (context.syncSuccessCount ?? imported) / syncTotal : imported > 0 ? 1 : 0,
      automationTriggerRate: imported > 0 ? automatedInvites / imported : 0,
      replayRate: events.length > 0 ? replayTotal / events.length : 0,
      manualOverrideRate: events.length > 0 ? manualOverrides / events.length : 0,
      averageCandidateProcessingMs: average(
        timelines.map((t) => t.totalProcessingMs).filter((ms): ms is number => ms !== undefined)
      ),
      averageEmployerSetupMs: average(setupTimes),
      syncSuccessRate: syncTotal > 0 ? (context.syncSuccessCount ?? 0) / syncTotal : 1,
      recoverySuccessRate: webhook
        ? webhook.deliverySuccess / Math.max(webhook.deliverySuccess + webhook.deliveryFailure, 1)
        : 1,
      averageQueueWaitMs: average(context.queueWaitSamplesMs ?? []),
    };
  }

  private calculateRoiMetrics(
    timelines: CandidateFunnelTimeline[],
    core: CoreHiringMetrics,
    advanced: AdvancedHiringMetrics
  ): RoiHiringMetrics {
    const automated = timelines.filter((t) => t.automated);
    const invited = timelines.filter((t) => t.stages.invitation_sent).length;

    const tasksPerCandidate =
      (invited > 0 ? 1 : 0) +
      (core.verificationCompletionRate > 0 ? 1 : 0) +
      (core.referenceCompletionRate > 0 ? 1 : 0);

    const manualTasksEliminated = Math.round(automated.length * tasksPerCandidate);
    const minutesSaved =
      automated.length * ROI_CONSTANTS.MANUAL_INVITE_MINUTES +
      timelines.filter((t) => t.stages.verification_completed).length *
        ROI_CONSTANTS.MANUAL_VERIFICATION_FOLLOWUP_MINUTES +
      timelines.filter((t) => t.stages.references_completed).length *
        ROI_CONSTANTS.MANUAL_REFERENCE_CHASE_MINUTES;

    const msSavedPerCandidate =
      automated.length > 0
        ? (minutesSaved * ROI_CONSTANTS.MS_PER_MINUTE) / automated.length
        : 0;

    return {
      hoursSaved: Math.round((minutesSaved / 60) * 10) / 10,
      manualTasksEliminated,
      averageTimeSavedPerCandidateMs: msSavedPerCandidate,
      candidatesProcessedAutomatically: automated.length,
      manualFollowUpReductionRate: advanced.automationTriggerRate * core.automationSuccessRate,
      automationCoverageRate: timelines.length > 0 ? automated.length / timelines.length : 0,
    };
  }

  private resolveCandidateId(event: ConnectStoredEvent): string | undefined {
    if (event.aggregateType === "candidate") return event.aggregateId;
    const model = event.payload?.universalModel as Record<string, unknown> | undefined;
    const candidate = model?.candidate as { externalId?: string } | undefined;
    if (candidate?.externalId) return candidate.externalId;
    const application = model?.application as { candidateExternalId?: string } | undefined;
    return application?.candidateExternalId;
  }

  private extractJobId(event: ConnectStoredEvent): string | undefined {
    const model = event.payload?.universalModel as Record<string, unknown> | undefined;
    const application = model?.application as { jobExternalId?: string } | undefined;
    if (application?.jobExternalId) return application.jobExternalId;
    const candidate = model?.candidate as { jobExternalId?: string } | undefined;
    return candidate?.jobExternalId;
  }

  private extractDepartment(event: ConnectStoredEvent): string | undefined {
    const model = event.payload?.universalModel as Record<string, unknown> | undefined;
    const application = model?.application as { metadata?: { department?: string } } | undefined;
    return application?.metadata?.department;
  }

  private estimateEmployerSetupTimes(events: ConnectStoredEvent[]): number[] {
    const connectionFirst = new Map<string, number>();
    const connectionWorkflow = new Map<string, number>();

    for (const event of events) {
      const conn = event.connectionId;
      if (!conn) continue;
      const ts = new Date(event.occurredAt).getTime();
      if (event.aggregateType === "connection" || event.eventType.includes("connection")) {
        connectionFirst.set(conn, Math.min(connectionFirst.get(conn) ?? ts, ts));
      }
      if (event.providerEventType === "lifecycle_orchestration") {
        connectionWorkflow.set(conn, Math.min(connectionWorkflow.get(conn) ?? ts, ts));
      }
    }

    const results: number[] = [];
    for (const [conn, first] of connectionFirst) {
      const workflow = connectionWorkflow.get(conn);
      if (workflow && workflow > first) results.push(workflow - first);
    }
    return results;
  }
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}
