"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WvCard, WvButton, WvBadge, WvPageHeader, WvLoadingState } from "@/components/wv";
import { Building2, Search, ShieldCheck, TrendingUp } from "lucide-react";
import UpgradeModal from "@/components/UpgradeModal";
import EmployerAnalytics from "./EmployerAnalytics";
import { AdvancedAnalytics } from "@/components/AdvancedAnalytics";
import { RehireProbabilityWidget } from "@/components/employer/RehireProbabilityWidget";
import { WorkforceRiskIndicator } from "@/components/employer/WorkforceRiskIndicator";
import { WorkforceRiskDashboard } from "@/components/employer/WorkforceRiskDashboard";
import { RehireRegistrySection, type RehireEntry } from "@/components/employer/RehireRegistrySection";
import VerificationLimitWarning from "@/components/VerificationLimitWarning";
import type { RecentView } from "@/lib/actions/employer/employerDashboardStats";
import ExportDataButton from "@/components/ExportDataButton";
import { UsagePanel } from "@/components/employer/UsagePanel";
import { UpgradeBanner } from "@/components/employer/UpgradeBanner";
import { UpgradeGate } from "@/components/employer/UpgradeGate";
import { ListedEmployeesCard } from "@/components/employer/ListedEmployeesCard";
import { EditCompanyInfo } from "@/components/employer/EditCompanyInfo";
import { EmployerProfileCompletionCard } from "@/components/employer/EmployerProfileCompletionCard";
import { CandidateViewHistoryCard } from "@/components/employer/CandidateViewHistoryCard";
import { EmployerHiringDecisionWorkspace } from "@/components/employer/EmployerHiringDecisionWorkspace";
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";
import { getVerticalConfig } from "@/lib/verticals/config";
import { runSimulation } from "@/lib/simulation/engine";
import type { PlanTier } from "@/lib/simulation/types";

interface EmployerDashboardClientProps {
  userRole: string;
  planTier?: string;
  employerId?: string;
  employerIndustry?: string | null;
  /** When true, fetch from sandbox employer-dashboard APIs instead of production. */
  sandboxMode?: boolean;
  sandboxId?: string | null;
  /** Show "Account created successfully" confirmation (e.g. after signup). */
  showWelcome?: boolean;
  /** Preloaded from getEmployerDashboardData (production only). */
  recentViews?: RecentView[];
}

export function EmployerDashboardClient({
  userRole,
  planTier,
  employerId,
  employerIndustry,
  sandboxMode = false,
  sandboxId = null,
  showWelcome = false,
  recentViews = [],
}: EmployerDashboardClientProps) {
  const router = useRouter();
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const vertical = getVerticalConfig(employerIndustry ?? undefined);
  const apiBaseUrl = sandboxMode && sandboxId
    ? `/api/admin/sandbox-v2/employer-dashboard`
    : "/api/employer";
  const sandboxQuery = sandboxMode && sandboxId ? `?sandboxId=${encodeURIComponent(sandboxId)}` : "";
  const { enabled: analyticsEnabled } = useFeatureFlag("advanced_analytics");
  const { enabled: rehireWidgetEnabled } = useFeatureFlag("rehire_probability_index");
  const { enabled: workforceRiskEnabled } = useFeatureFlag("workforce_risk_indicator");
  const { enabled: riskSnapshotEnabled } = useFeatureFlag("risk_snapshot");
  const { enabled: workforceDashboardEnabled } = useFeatureFlag("workforce_dashboard");
  const { enabled: rehireSystemEnabled } = useFeatureFlag("rehire_system");
  const { enabled: riskDashboardEnabled } = useFeatureFlag("workforce_risk_dashboard");
  const { enabled: enterpriseIntelligenceHidden } = useFeatureFlag("enterprise_intelligence_hidden");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [workforceStats, setWorkforceStats] = useState<{
    totalVerified: number;
    verificationCompletionRate: number | null;
    disputeRate: number | null;
    rehireEligibilityPct: number | null;
  } | null>(null);
  const [workforceStatsLoading, setWorkforceStatsLoading] = useState(true);
  const [riskOverview, setRiskOverview] = useState<{
    workforceRiskAverage: number | null;
    workforceHighRiskCount: number;
    workforceRiskConfidence: number | null;
    workforceLastCalculated: string | null;
    riskSnapshotSample: {
      tenure?: number;
      references?: number;
      disputes?: number;
      gaps?: number;
      rehire?: number;
      overall?: number;
      confidence?: number;
      version?: string;
    } | null;
  } | null>(null);
  const [rehireList, setRehireList] = useState<RehireEntry[]>([]);
  const [riskOverviewLoading, setRiskOverviewLoading] = useState(false);
  const [rehireListLoading, setRehireListLoading] = useState(false);
  const [rehireData, setRehireData] = useState<any[]>([]);
  const [trustScores, setTrustScores] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [verificationCount, setVerificationCount] = useState(0);
  const [verificationLimit, setVerificationLimit] = useState(10);

  useEffect(() => {
    // Fetch verification limit data
    if (employerId) {
      fetch(`/api/employer/verification-limit?employerId=${employerId}`)
        .then((r) => r.json())
        .then((data) => {
          setVerificationCount(data.currentCount || 0);
          setVerificationLimit(data.limit || 10);
        })
        .catch((error) => {
          console.error("Failed to fetch verification limit:", error);
        });
    }

    // Fetch additional data if user has pro plan
    if (planTier === "pro") {
      // Fetch analytics data
      if (employerId) {
        setLoadingAnalytics(true);
        Promise.all([
          fetch(`/api/employer/analytics/rehire?employerId=${employerId}`).then(
            (r) => r.json(),
          ),
          fetch(
            `/api/employer/analytics/trust-scores?employerId=${employerId}`,
          ).then((r) => r.json()),
        ])
          .then(([rehire, trust]) => {
            setRehireData(rehire.data || []);
            setTrustScores(trust.data || []);
            setLoadingAnalytics(false);
          })
          .catch(() => {
            setLoadingAnalytics(false);
          });
      }
    }
  }, [planTier, employerId]);

  useEffect(() => {
    if (!riskSnapshotEnabled && !workforceDashboardEnabled) return;
    setRiskOverviewLoading(true);
    fetch("/api/employer/risk-overview", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error == null) setRiskOverview(data);
      })
      .catch((error) => { console.error("[SYSTEM_FAIL]", error); })
      .finally(() => setRiskOverviewLoading(false));
  }, [riskSnapshotEnabled, workforceDashboardEnabled]);

  const fetchRehireList = useCallback(() => {
    setRehireListLoading(true);
    fetch("/api/employer/rehire", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.data)) setRehireList(data.data);
      })
      .catch((error) => { console.error("[SYSTEM_FAIL]", error); })
      .finally(() => setRehireListLoading(false));
  }, []);

  useEffect(() => {
    if (!rehireSystemEnabled) return;
    fetchRehireList();
  }, [rehireSystemEnabled, fetchRehireList]);

  useEffect(() => {
    setWorkforceStatsLoading(true);
    const url = sandboxMode && sandboxId
      ? `${apiBaseUrl}/dashboard-stats${sandboxQuery}`
      : "/api/employer/dashboard-stats";
    fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setWorkforceStats(null);
          return;
        }
        setWorkforceStats({
          totalVerified: data.totalVerified ?? 0,
          verificationCompletionRate: data.verificationCompletionRate ?? null,
          disputeRate: data.disputeRate ?? null,
          rehireEligibilityPct: data.rehireEligibilityPct ?? null,
        });
      })
      .catch(() => setWorkforceStats(null))
      .finally(() => setWorkforceStatsLoading(false));
  }, [apiBaseUrl, sandboxMode, sandboxId, sandboxQuery]);

  const isFreePlan = planTier === "free" || !planTier;
  const isBasicPlan = planTier === "free" || planTier === "basic" || planTier === "lite" || !planTier;

  return (
    <>
      {isBasicPlan && showUpgradeModal && (
        <UpgradeModal
          feature="Pro Features"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {showWelcome && !welcomeDismissed && (
          <WvCard glow className="border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-4">
            <p className="font-semibold text-emerald-300">Account ready. Complete your company profile to start hiring.</p>
            <div className="flex items-center gap-2">
              <WvButton
                size="sm"
                variant="secondary"
                onClick={() => {
                  setWelcomeDismissed(true);
                  router.replace("/employer/dashboard", { scroll: false });
                }}
              >
                Dismiss
              </WvButton>
              <WvButton href="/employer/settings" size="sm">
                Set up company
              </WvButton>
            </div>
          </WvCard>
        )}
        {isFreePlan && <UpgradeBanner />}

        <WvCard glow>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-wv-foreground">Verified candidates</h2>
              <p className="mt-1 text-sm text-wv-muted">
                Browse coworker-verified profiles. Upgrade for full directory access.
              </p>
            </div>
            <WvButton href="/employer/verified-workers" className="shrink-0">
              Browse directory
            </WvButton>
          </div>
        </WvCard>

        <WvPageHeader
          eyebrow="Overview"
          title="Dashboard"
          description="Search verified candidates, manage verification requests, and monitor hiring activity."
          action={
            planTier ? (
              <WvBadge variant={planTier === "pro" ? "brand" : planTier === "custom" ? "warning" : "default"}>
                {planTier === "free" || !planTier
                  ? "FREE"
                  : planTier === "custom"
                  ? "CUSTOM"
                  : planTier === "pro"
                  ? "PRO"
                  : "STARTER"}
              </WvBadge>
            ) : undefined
          }
        />
        <div className="mb-2">
          <EditCompanyInfo />
        </div>

        {/* Plan & Usage */}
        <UsagePanel apiBaseUrl={sandboxMode ? apiBaseUrl : undefined} sandboxId={sandboxMode ? sandboxId ?? undefined : undefined} />

        {/* Vertical Intelligence (display only) */}
        {vertical && (
          <WvCard className="mt-6 border-blue-500/30">
            <h2 className="text-lg font-semibold text-wv-foreground">{vertical.label}</h2>
            <p className="mt-2 text-sm text-wv-muted">{vertical.description}</p>
            <div className="mt-4">
              <p className="font-medium text-wv-brand-blue">Highlighted metrics</p>
              <ul className="mt-1 list-disc pl-6 text-sm text-wv-muted">
                {vertical.highlightMetrics.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <p className="font-medium text-red-400">Risk signals</p>
              <ul className="mt-1 list-disc pl-6 text-sm text-wv-muted">
                {vertical.riskSignals.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </WvCard>
        )}

        {/* Employees Who Listed You */}
        <div className="mt-6">
          <ListedEmployeesCard apiBaseUrl={sandboxMode ? apiBaseUrl : undefined} sandboxId={sandboxMode ? sandboxId ?? undefined : undefined} />
        </div>

        {/* Company profile completion status (name, industry, location, verification) */}
        <div className="mt-6">
          <EmployerProfileCompletionCard />
        </div>

        {/* Recent candidate profile views */}
        <div className="mt-6">
          <CandidateViewHistoryCard recentViews={sandboxMode ? undefined : recentViews} />
        </div>

        {/* Workforce Integrity Dashboard: hidden enterprise — admin/superadmin or enterprise_intelligence_hidden only */}
        {(userRole === "admin" || userRole === "superadmin" || enterpriseIntelligenceHidden) && (
          isFreePlan ? (
            <div className="mt-6">
              <UpgradeGate feature="Workforce Risk Dashboard" />
            </div>
          ) : riskDashboardEnabled ? (
            <div className="mt-6">
              <WorkforceRiskDashboard />
            </div>
          ) : null
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <WvButton
            id="onboarding-company-profile"
            variant="secondary"
            href="/employer/settings"
            className="h-auto flex-col items-start p-4 text-left"
          >
            <Building2 className="mb-2 h-6 w-6" aria-hidden />
            <span className="font-semibold">Company profile</span>
            <span className="text-sm opacity-90">Set up your organization details</span>
          </WvButton>
          <WvButton
            id="onboarding-add-team"
            variant="secondary"
            href="/employer/search-users"
            className="h-auto flex-col items-start p-4 text-left"
          >
            <Search className="mb-2 h-6 w-6" aria-hidden />
            <span className="font-semibold">Search candidates</span>
            <span className="text-sm opacity-90">Filter by role, industry, and trust score</span>
          </WvButton>
          <WvButton
            id="onboarding-request-verification"
            variant="secondary"
            href="/employer/candidates"
            className="h-auto flex-col items-start p-4 text-left"
          >
            <ShieldCheck className="mb-2 h-6 w-6" aria-hidden />
            <span className="font-semibold">Verifications</span>
            <span className="text-sm opacity-90">Review saved candidates and request verification</span>
          </WvButton>
          {isFreePlan ? (
            <WvButton variant="secondary" href="/employer/upgrade" className="h-auto flex-col items-start p-4 text-left">
              <TrendingUp className="mb-2 h-6 w-6" aria-hidden />
              <span className="font-semibold">Upgrade</span>
              <span className="text-sm opacity-90">Unlock full search and trust analytics</span>
            </WvButton>
          ) : (
            <WvButton
              variant="secondary"
              href={isBasicPlan ? undefined : "/pricing"}
              className="h-auto flex-col items-start p-4 text-left"
              onClick={
                isBasicPlan
                  ? (e) => {
                      e.preventDefault();
                      setShowUpgradeModal(true);
                    }
                  : undefined
              }
            >
              <TrendingUp className="mb-2 h-6 w-6" aria-hidden />
              <span className="font-semibold">Upgrade</span>
              <span className="text-sm opacity-90">Unlock full search and trust analytics</span>
            </WvButton>
          )}
        </div>

        {/* Workforce Overview */}
        <WvCard>
          <h2 className="mb-4 text-xl font-semibold text-wv-foreground">Workforce overview</h2>
          {workforceStatsLoading ? (
            <WvLoadingState label="Loading workforce metrics…" size="sm" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-wv-muted">Total verified employees</p>
                <p className="text-2xl font-bold text-wv-foreground">{workforceStats?.totalVerified ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-wv-muted">Verification completion rate (30d)</p>
                <p className="text-2xl font-bold text-wv-foreground">{workforceStats?.verificationCompletionRate != null ? `${workforceStats.verificationCompletionRate}%` : "—"}</p>
              </div>
              <div>
                <p className="text-sm text-wv-muted">Dispute rate</p>
                <p className="text-2xl font-bold text-wv-foreground">{workforceStats?.disputeRate != null ? `${workforceStats.disputeRate}%` : "—"}</p>
              </div>
              <div>
                <p className="text-sm text-wv-muted">Rehire eligibility %</p>
                <p className="text-2xl font-bold text-wv-foreground">{workforceStats?.rehireEligibilityPct != null ? `${workforceStats.rehireEligibilityPct}%` : "—"}</p>
              </div>
            </div>
          )}
        </WvCard>

        {/* Workforce Risk Overview — Risk Band (no raw score), Avg, High Risk Count */}
        {(riskSnapshotEnabled || workforceDashboardEnabled) && !isFreePlan && (
          <WvCard>
            <h2 className="text-xl font-semibold text-wv-foreground mb-4">
              Workforce Risk Overview
            </h2>
            {riskOverviewLoading ? (
              <p className="text-sm text-wv-muted">Loading…</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-wv-muted">Avg workforce risk band</p>
                  <p className="text-2xl font-bold text-wv-foreground">
                    {riskOverview?.workforceRiskAverage != null
                      ? riskOverview.workforceRiskAverage >= 70
                        ? "Low"
                        : riskOverview.workforceRiskAverage >= 40
                          ? "Medium"
                          : "High"
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-wv-muted">High risk count</p>
                  <p className="text-2xl font-bold text-wv-foreground">{riskOverview?.workforceHighRiskCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-wv-muted">Verification completion rate</p>
                  <p className="text-2xl font-bold text-wv-foreground">{workforceStats?.verificationCompletionRate != null ? `${workforceStats.verificationCompletionRate}%` : "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-wv-muted">Dispute rate</p>
                  <p className="text-2xl font-bold text-wv-foreground">{workforceStats?.disputeRate != null ? `${workforceStats.disputeRate}%` : "—"}</p>
                </div>
              </div>
            )}
          </WvCard>
        )}

        {/* Alerts — approaching limits, disputes, verification gaps */}
        <WvCard>
          <h2 className="text-xl font-semibold text-wv-foreground mb-4">
            Alerts
          </h2>
          <div className="space-y-2">
            {workforceStatsLoading && (
              <p className="text-sm text-wv-muted">Loading…</p>
            )}
            {!workforceStatsLoading && isBasicPlan && verificationLimit > 0 && verificationCount >= verificationLimit * 0.8 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Approaching verification limit: {verificationCount} / {verificationLimit} used.
              </p>
            )}
            {workforceStats?.disputeRate != null && workforceStats.disputeRate > 10 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Dispute rate above 10%. Review open disputes in your team.
              </p>
            )}
            {workforceStats?.verificationCompletionRate != null && workforceStats.verificationCompletionRate < 50 && (workforceStats?.totalVerified ?? 0) > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Verification completion rate below 50%. Consider following up on pending requests.
              </p>
            )}
            {!workforceStatsLoading && !workforceStats?.totalVerified && (
              <p className="text-sm text-wv-muted">No alerts. Add and verify employees to see alerts here.</p>
            )}
            {!workforceStatsLoading && (workforceStats?.totalVerified ?? 0) > 0 && (!workforceStats?.disputeRate || workforceStats.disputeRate <= 10) && (workforceStats?.verificationCompletionRate == null || workforceStats.verificationCompletionRate >= 50) && (!isBasicPlan || verificationCount < verificationLimit * 0.8) && (
              <p className="text-sm text-wv-muted">No active alerts.</p>
            )}
          </div>
        </WvCard>

        {/* Candidate Oversight — recent checks, risk band distribution */}
        {(riskSnapshotEnabled || workforceDashboardEnabled) && !isFreePlan && (
          <WvCard>
            <h2 className="text-xl font-semibold text-wv-foreground mb-4">
              Candidate Oversight
            </h2>
            {riskOverviewLoading ? (
              <p className="text-sm text-wv-muted">Loading…</p>
            ) : riskOverview?.riskSnapshotSample ? (
              <div className="space-y-4">
                <p className="text-sm text-wv-muted">Recent check sample — risk band distribution</p>
                <div className="flex flex-wrap gap-4">
                  <span className="inline-flex items-center rounded-md bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    Low (70–100)
                  </span>
                  <span className="inline-flex items-center rounded-md bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-sm font-medium text-amber-800 dark:text-amber-200">
                    Medium (40–69)
                  </span>
                  <span className="inline-flex items-center rounded-md bg-red-100 dark:bg-red-900/30 px-3 py-1 text-sm font-medium text-red-800 dark:text-red-200">
                    High (0–39)
                  </span>
                </div>
                <p className="text-sm text-wv-muted">
                  Workforce average band: {riskOverview.workforceRiskAverage != null
                    ? riskOverview.workforceRiskAverage >= 70
                      ? "Low"
                      : riskOverview.workforceRiskAverage >= 40
                        ? "Medium"
                        : "High"
                    : "—"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-wv-muted">No candidate checks yet. Verified employees will appear here.</p>
            )}
          </WvCard>
        )}

        {/* Hiring Confidence — Pro only */}
        {planTier === "pro" && !isFreePlan && (
          <WvCard>
            <h2 className="text-xl font-semibold text-wv-foreground mb-2">
              Hiring Confidence
            </h2>
            <p className="text-sm text-wv-muted mb-4">Pro: view hiring confidence indicators for your verified workforce.</p>
            <WvButton variant="secondary" href="/employer/candidates">View candidates</WvButton>
          </WvCard>
        )}

        {/* Team Fit — Pro / Enterprise only */}
        {(planTier === "pro" || planTier === "custom") && !isFreePlan && (
          <WvCard>
            <h2 className="text-xl font-semibold text-wv-foreground mb-2">
              Team Fit
            </h2>
            <p className="text-sm text-wv-muted mb-4">See how candidates fit with your team based on verified data.</p>
            <WvButton variant="secondary" href="/employer/candidates">View team fit</WvButton>
          </WvCard>
        )}

        {/* Verification Limit Warning */}
        {isBasicPlan && (
          <VerificationLimitWarning
            limit={verificationLimit}
            used={verificationCount}
          />
        )}

        {/* Advanced Analytics (feature-flagged) */}
        {analyticsEnabled && (
          <div className="mt-6">
            <AdvancedAnalytics />
          </div>
        )}
        {!analyticsEnabled && (
          <div className="mt-6 rounded-xl border border-wv-border bg-wv-surface p-6">
            <p className="text-sm text-wv-muted">Unlock advanced analytics with a Pro plan.</p>
            <WvButton className="mt-3" onClick={() => setShowUpgradeModal(true)}>Upgrade to see analytics</WvButton>
          </div>
        )}

        {/* Rehire Probability Widget (feature-flagged; gated for free) */}
        {rehireWidgetEnabled && (
          <div className="mt-6">
            {isFreePlan ? (
              <UpgradeGate feature="Rehire & Team Fit insights" />
            ) : (
              <RehireProbabilityWidget />
            )}
          </div>
        )}

        {/* Workforce Risk Indicator (feature-flagged; gated for free) */}
        {workforceRiskEnabled && (
          <div className="mt-6">
            {isFreePlan ? (
              <UpgradeGate feature="Workforce Risk Indicator" />
            ) : (
              <WorkforceRiskIndicator />
            )}
          </div>
        )}

        {/* Rehire Registry (feature-flagged; gated for free) */}
        {rehireSystemEnabled && (
          <div className="mt-6">
            {isFreePlan ? (
              <UpgradeGate feature="Rehire Registry" />
            ) : rehireListLoading ? (
              <WvCard>
                <p className="text-sm text-wv-muted">Loading rehire registry…</p>
              </WvCard>
            ) : (
              <RehireRegistrySection entries={rehireList} onRefresh={fetchRehireList} />
            )}
          </div>
        )}

        {/* Analytics Section */}
        <div id="onboarding-analytics" className="mt-8">
          {loadingAnalytics ? (
            <WvCard>
              <p className="text-wv-muted text-center">
                Loading analytics...
              </p>
            </WvCard>
          ) : (
            <>
              <EmployerAnalytics
                rehireData={rehireData}
                trustScores={trustScores}
                userRole={userRole}
                planTier={planTier}
              />
              {/* Export: Pro only; free sees upgrade gate */}
              {isFreePlan ? (
                <div className="mt-6">
                  <UpgradeGate feature="Export data" />
                </div>
              ) : planTier === "pro" ? (
                <div className="mt-6 flex gap-4">
                  <ExportDataButton
                    endpoint="/api/employer/analytics/export?type=rehire"
                    filename="rehire-data.csv"
                    label="Export Rehire Data"
                  />
                  <ExportDataButton
                    endpoint="/api/employer/analytics/export?type=trust-scores"
                    filename="trust-scores.csv"
                    label="Export trust scores"
                  />
                </div>
              ) : null}
            </>
          )}
        </div>

        <EmployerHiringDecisionWorkspace employerId={employerId ?? null} />
      </div>
    </>
  );
}
