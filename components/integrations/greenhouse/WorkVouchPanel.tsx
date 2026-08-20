"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ExternalLink,
  History,
  ListTree,
  RefreshCw,
  RotateCcw,
  Shield,
} from "lucide-react";
import type { GreenhousePanelPayload } from "@/lib/integrations/greenhouse/panel/types";
import { ConnectionBanner } from "./ConnectionBanner";
import { HiringConfidenceHero } from "./HiringConfidenceHero";
import { TrustScoreSupporting } from "./TrustScoreSupporting";
import { ConfidenceExplanationCard } from "./ConfidenceExplanationCard";
import { ConfidenceTimelineCard } from "./ConfidenceTimelineCard";
import { ConfidenceBadgesRow } from "./ConfidenceBadgesRow";
import { VerificationCard } from "./VerificationCard";
import { WorkflowStatus } from "./WorkflowStatus";
import { PanelNotLinkedState } from "./EmptyStates";
import { PanelSectionSkeleton } from "./LoadingStates";
import { ghPanel } from "./panel-theme";

const EmploymentTimeline = dynamic(
  () => import("./EmploymentTimeline").then((m) => m.EmploymentTimeline),
  { loading: () => <PanelSectionSkeleton label="Loading employment timeline" /> }
);

const ReferenceSummary = dynamic(
  () => import("./ReferenceSummary").then((m) => m.ReferenceSummary),
  { loading: () => <PanelSectionSkeleton label="Loading reference summary" /> }
);

const CandidateInsights = dynamic(
  () => import("./CandidateInsights").then((m) => m.CandidateInsights),
  { loading: () => <PanelSectionSkeleton label="Loading hiring intelligence" /> }
);

export interface WorkVouchPanelProps {
  data: GreenhousePanelPayload;
  onRefresh?: () => Promise<void> | void;
  onRetrySync?: () => void;
  onReplayWorkflow?: () => void;
}

export function WorkVouchPanel({ data, onRefresh, onRetrySync, onReplayWorkflow }: WorkVouchPanelProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  const openExternal = (url: string | null) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={`${ghPanel.shell} mx-auto w-full max-w-[360px]`}
      role="region"
      aria-label={`WorkVouch panel for ${data.candidateName}`}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#e1e6e4] bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 shrink-0 text-[#047957]" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wide text-[#047957]">WorkVouch</span>
            </div>
            <h1 className="mt-1 truncate text-base font-semibold text-[#15372c]">{data.candidateName}</h1>
            <p className="text-xs text-[#5c6c66]">Stage · {data.currentStage}</p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || !onRefresh}
            aria-label="Refresh candidate data"
            className={`rounded-md p-2 text-[#5c6c66] hover:bg-[#f3f5f4] disabled:opacity-50 ${ghPanel.focusRing}`}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
          </button>
        </div>
      </header>

      <ConnectionBanner
        linkStatus={data.linkStatus}
        connectionHealthy={data.syncStatus.connectionHealthy}
        lastSyncedAt={data.syncStatus.lastSyncedAt}
        onReconnect={data.actions.canRetrySync ? onRetrySync : undefined}
      />

      <main className="space-y-3 p-4 pb-6">
        {data.linkStatus === "not_linked" ? (
          <PanelNotLinkedState candidateName={data.candidateName} />
        ) : (
          <>
            <HiringConfidenceHero confidence={data.hiringConfidence} />

            <TrustScoreSupporting trustScore={data.trustScore} trustBand={data.trustBand} />

            <ConfidenceExplanationCard
              explanation={data.hiringConfidence.confidenceExplanation}
              factors={data.hiringConfidence.confidenceFactors}
            />

            <ConfidenceBadgesRow badges={data.hiringConfidence.confidenceBadges} />

            <VerificationCard
              verificationStatus={data.verificationStatus}
              employmentVerified={data.employmentVerified}
              managerReferences={data.managerReferences}
              coworkerReferences={data.coworkerReferences}
              referenceCompletionPct={data.referenceCompletionPct}
            />

            <WorkflowStatus steps={data.workflowStatus} />

            <ConfidenceTimelineCard timeline={data.hiringConfidence.confidenceTimeline} />

            <EmploymentTimeline entries={data.employmentTimeline} />

            <ReferenceSummary summary={data.referenceSummary} />

            <CandidateInsights
              hiringIntelligence={data.hiringIntelligence}
              aiSummary={data.aiSummary}
              aiSummaryGeneratedAt={data.aiSummaryGeneratedAt}
            />
          </>
        )}

        {/* Actions */}
        <section
          className={`${ghPanel.card} ${ghPanel.cardPadding}`}
          aria-labelledby="wv-actions-heading"
        >
          <h2 id="wv-actions-heading" className={ghPanel.heading}>
            Actions
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {data.actions.canOpenFullReport && data.fullReportUrl && (
              <ActionButton
                icon={ExternalLink}
                label="Open Full WorkVouch Report"
                onClick={() => openExternal(data.fullReportUrl)}
              />
            )}
            {data.actions.canViewTimeline && data.timelineUrl && (
              <ActionButton
                icon={ListTree}
                label="View Timeline"
                onClick={() => openExternal(data.timelineUrl)}
              />
            )}
            {data.actions.canViewAudit && data.auditUrl && (
              <ActionButton
                icon={History}
                label="View Audit"
                onClick={() => openExternal(data.auditUrl)}
              />
            )}
            {data.actions.canReplayWorkflow && onReplayWorkflow && (
              <ActionButton icon={RotateCcw} label="Replay Workflow" onClick={onReplayWorkflow} />
            )}
            {data.actions.canRetrySync && onRetrySync && (
              <ActionButton icon={RefreshCw} label="Retry Synchronization" onClick={onRetrySync} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex w-full items-center gap-2 rounded-md border border-[#e1e6e4] px-3 py-2 text-left text-xs font-medium text-[#15372c] hover:bg-[#f8f9fb] ${ghPanel.focusRing}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-[#047957]" aria-hidden={true} />
      {label}
    </button>
  );
}
