import { admin } from "@/lib/supabase-admin";
import { calculateTrust } from "@/lib/trust/trustEngine";
import { getTrustBandLabel } from "@/lib/trust/trustBandLabels";
import type { ConnectRuntime } from "../../connect/connect-runtime";
import type { LifecycleState } from "../../connect/orchestration/types";
import { buildDemoPanelPayload } from "./demo-payload";
import { buildDemoScenarioPayload } from "./demo-scenarios";
import { buildTrustExplainability } from "./explainability";
import type {
  GreenhousePanelPayload,
  PanelBuildInput,
  PanelEmploymentEntry,
  PanelReferenceSummary,
  PanelVerificationStatus,
} from "./types";
import { mapLifecycleToWorkflowSteps } from "./types";
import { nowIso } from "../../utils/correlation";
import { hiringConfidenceEngine } from "@/lib/trust/confidence";

export interface GreenhousePanelServiceDeps {
  runtime: ConnectRuntime;
}

/** Aggregates Connect + trust data for the Greenhouse embedded recruiter panel. */
export class GreenhousePanelService {
  constructor(private readonly deps: GreenhousePanelServiceDeps) {}

  async buildPanel(input: PanelBuildInput): Promise<GreenhousePanelPayload> {
    if (input.demo) {
      return buildDemoScenarioPayload(
        input.externalCandidateId,
        (input.demoScenario as "high" | "moderate" | "warning" | "not_linked") ?? "high"
      );
    }

    const start = Date.now();
    const connection = await this.deps.runtime.connections.getConnection(input.connectionId);
    if (!connection || connection.employerAccountId !== input.employerAccountId) {
      throw new Error("Connection not found or access denied");
    }

    const [candidateRow, lifecycleRow, healthReport, hiringMetrics] = await Promise.all([
      loadCandidateMap(input.connectionId, input.externalCandidateId),
      loadLifecycleState(input.connectionId, input.externalCandidateId),
      this.deps.runtime.health.evaluate(input.connectionId),
      this.deps.runtime.hiringMetrics
        .computeMetrics({
          employerAccountId: input.employerAccountId,
          connectionId: input.connectionId,
          period: "30d",
        })
        .catch(() => null),
    ]);

    const profileId = candidateRow?.workvouch_profile_id ?? candidateRow?.workvouchProfileId;
    const candidateName =
      candidateRow?.candidate_name ??
      candidateRow?.candidateName ??
      "Candidate";
    const currentStage =
      String(candidateRow?.application_status ?? candidateRow?.applicationStatus ?? "Unknown");

    let trustScore: number | null = null;
    let trustBand: string | null = null;
    let explainability = buildTrustExplainability(0, {
      verifiedEmployments: 0,
      totalVerifiedYears: 0,
      averageReferenceRating: 0,
      referenceCount: 0,
      uniqueEmployersWithReferences: 0,
      fraudFlagsCount: 0,
    });
    let employmentTimeline: PanelEmploymentEntry[] = [];
    let referenceSummary: PanelReferenceSummary = emptyReferenceSummary();
    let verificationStatus: PanelVerificationStatus = profileId ? "in_progress" : "not_started";
    let employmentVerified = false;

    if (profileId) {
      const trust = await calculateTrust(String(profileId)).catch(() => null);
      if (trust) {
        trustScore = trust.score;
        trustBand = getTrustBandLabel(trust.score);
        explainability = buildTrustExplainability(trust.score, trust.components);
        employmentVerified = trust.verifiedEmploymentCount > 0;
        verificationStatus = employmentVerified ? "verified" : "in_progress";
      }

      [employmentTimeline, referenceSummary] = await Promise.all([
        loadEmploymentTimeline(String(profileId)),
        loadReferenceSummary(String(profileId)),
      ]);
    }

    const lifecycleState = (lifecycleRow?.state as LifecycleState | undefined) ?? null;
    const linkStatus = profileId ? "synced" : candidateRow ? "pending" : "not_linked";
    const connectionHealthy = healthReport.overallStatus === "healthy";

    const workflowStatus = mapLifecycleToWorkflowSteps(lifecycleState);
    const timelineConfidenceAvg =
      employmentTimeline.length > 0
        ? employmentTimeline.reduce((s, e) => s + e.timelineConfidence, 0) / employmentTimeline.length
        : 0.5;
    const workflowCompletionPct = Math.round(
      (workflowStatus.filter((s) => s.status === "complete").length / workflowStatus.length) * 100
    );

    const hiringConfidence = hiringConfidenceEngine.computeFromPanelSignals({
      trustScore,
      employmentVerified,
      managerReferences: referenceSummary.managers,
      coworkerReferences: referenceSummary.coworkers,
      referenceCompletionPct: referenceSummary.completionPct,
      referenceConsensus: referenceSummary.overallConsensus,
      timelineConfidenceAvg,
      workflowCompletionPct,
      dataFreshnessHours: connection.lastSyncAt
        ? (Date.now() - new Date(String(connection.lastSyncAt)).getTime()) / 3_600_000
        : null,
      workflowMilestones: [
        { id: "imported", label: "Application Imported", completionPct: 0.6 },
        { id: "verification", label: "Verification Complete", completionPct: 0.79 },
        { id: "references", label: "References Complete", completionPct: 0.94 },
        { id: "trust", label: "Trust Updated", completionPct: 1 },
      ],
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://workvouch.com";

    return {
      provider: "greenhouse",
      externalCandidateId: input.externalCandidateId,
      connectionId: input.connectionId,
      employerAccountId: input.employerAccountId,
      linkStatus,
      candidateName,
      currentStage,
      trustScore,
      trustBand,
      hiringConfidence,
      verificationStatus,
      employmentVerified,
      managerReferences: referenceSummary.managers,
      coworkerReferences: referenceSummary.coworkers,
      referenceCompletionPct: referenceSummary.completionPct,
      workflowStatus,
      lastUpdated: nowIso(),
      explainability,
      employmentTimeline,
      referenceSummary,
      hiringIntelligence: {
        averageVerificationTimeHours: hiringMetrics?.core?.averageVerificationMs
          ? Math.round((hiringMetrics.core.averageVerificationMs / 3_600_000) * 10) / 10
          : null,
        completionRatePct: hiringMetrics?.core?.verificationCompletionRate
          ? Math.round(hiringMetrics.core.verificationCompletionRate * 100)
          : null,
        averageReferenceTimeHours: hiringMetrics?.core?.averageReferenceResponseMs
          ? Math.round((hiringMetrics.core.averageReferenceResponseMs / 3_600_000) * 10) / 10
          : null,
        automationEnabled: Boolean(
          (connection.metadata?.sync_preferences as Record<string, unknown>)?.automation &&
          ((connection.metadata?.sync_preferences as Record<string, { auto_invite_enabled?: boolean }>)?.automation
            ?.auto_invite_enabled ?? false)
        ),
        processingTimeMs: Date.now() - start,
      },
      syncStatus: {
        lastSyncedAt: connection.lastSyncAt ?? candidateRow?.updated_at ?? candidateRow?.updatedAt ?? null,
        status: linkStatus === "synced" && connectionHealthy ? "synced" : linkStatus === "synced" ? "stale" : linkStatus,
        connectionHealthy,
      },
      profileUrl: profileId ? `${baseUrl}/v/${profileId}` : null,
      fullReportUrl: profileId ? `${baseUrl}/employer/candidates/${profileId}` : null,
      timelineUrl: profileId
        ? `/api/employer/candidate/${profileId}/timeline`
        : null,
      auditUrl: input.connectionId
        ? `/employer/integrations/events?connectionId=${input.connectionId}`
        : null,
      actions: {
        canRefresh: true,
        canReplayWorkflow: Boolean(input.connectionId && profileId),
        canViewTimeline: Boolean(profileId),
        canViewAudit: Boolean(input.connectionId),
        canOpenFullReport: Boolean(profileId),
        canRetrySync: !connectionHealthy,
      },
    };
  }
}

async function loadCandidateMap(connectionId: string, externalCandidateId: string) {
  const { data } = await admin
    .from("connect_candidate_map")
    .select("*")
    .eq("connection_id", connectionId)
    .eq("external_candidate_id", externalCandidateId)
    .maybeSingle();
  return data as Record<string, unknown> | null;
}

async function loadLifecycleState(connectionId: string, externalCandidateId: string) {
  const { data } = await admin
    .from("connect_lifecycle_state")
    .select("state, updated_at")
    .eq("connection_id", connectionId)
    .eq("external_candidate_id", externalCandidateId)
    .maybeSingle();
  return data as { state: string; updated_at: string } | null;
}

async function loadEmploymentTimeline(profileId: string): Promise<PanelEmploymentEntry[]> {
  const { data: records } = await admin
    .from("employment_records")
    .select("id, company_name, job_title, start_date, end_date, verification_status")
    .eq("user_id", profileId)
    .order("start_date", { ascending: false })
    .limit(10);

  const entries = (records ?? []) as Array<{
    id: string;
    company_name: string;
    job_title: string;
    start_date: string;
    end_date: string | null;
    verification_status: string;
  }>;

  const result: PanelEmploymentEntry[] = [];
  for (const row of entries) {
    const refs = await loadEmploymentReferenceCounts(profileId, row.id);
    const verified = row.verification_status === "verified";
    result.push({
      id: row.id,
      employer: row.company_name,
      role: row.job_title,
      startDate: row.start_date?.slice(0, 7) ?? "",
      endDate: row.end_date ? row.end_date.slice(0, 7) : null,
      verificationStatus: mapVerificationStatus(row.verification_status),
      managerVerified: refs.manager > 0,
      coworkerVerified: refs.coworker > 0,
      timelineConfidence: verified ? 0.9 : 0.5,
    });
  }
  return result;
}

async function loadEmploymentReferenceCounts(profileId: string, employmentId: string) {
  const { data } = await admin
    .from("verification_requests")
    .select("relationship_type")
    .eq("requester_profile_id", profileId)
    .eq("employment_record_id", employmentId)
    .eq("status", "accepted");

  const list = (data ?? []) as Array<{ relationship_type: string }>;
  return {
    manager: list.filter((r) => r.relationship_type === "manager").length,
    coworker: list.filter((r) => r.relationship_type === "peer" || r.relationship_type === "coworker").length,
  };
}

async function loadReferenceSummary(profileId: string): Promise<PanelReferenceSummary> {
  const { data: pendingRows } = await admin
    .from("verification_requests")
    .select("relationship_type, status")
    .eq("requester_profile_id", profileId);

  const list = (pendingRows ?? []) as Array<{ relationship_type: string; status: string }>;
  const accepted = list.filter((r) => r.status === "accepted");
  const pending = list.filter((r) => r.status === "pending").length;
  const managers = accepted.filter((r) => r.relationship_type === "manager").length;
  const coworkers = accepted.filter(
    (r) => r.relationship_type === "coworker" || r.relationship_type === "peer"
  ).length;
  const completed = accepted.length;
  const total = list.length;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : completed > 0 ? 100 : 0;

  return {
    completed,
    pending,
    managers,
    coworkers,
    wouldRehire: completed >= 3 ? "yes" : completed > 0 ? "mixed" : "unknown",
    overallConsensus: completed >= 4 ? "strong" : completed >= 2 ? "moderate" : "unknown",
    completionPct,
  };
}

function mapVerificationStatus(status: string): PanelVerificationStatus {
  if (status === "verified") return "verified";
  if (status === "failed") return "failed";
  if (status === "in_progress" || status === "pending") return "in_progress";
  return "not_started";
}

function emptyReferenceSummary(): PanelReferenceSummary {
  return {
    completed: 0,
    pending: 0,
    managers: 0,
    coworkers: 0,
    wouldRehire: "unknown",
    overallConsensus: "unknown",
    completionPct: 0,
  };
}
