"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UpgradeModal from "@/components/UpgradeModal";
import EmployerAnalytics from "./EmployerAnalytics";
import { AdvancedAnalytics } from "@/components/AdvancedAnalytics";
import { RehireProbabilityWidget } from "@/components/employer/RehireProbabilityWidget";
import { WorkforceRiskIndicator } from "@/components/employer/WorkforceRiskIndicator";
import { WorkforceRiskDashboard } from "@/components/employer/WorkforceRiskDashboard";
import { RehireRegistrySection, type RehireEntry } from "@/components/employer/RehireRegistrySection";
import { SecurityDashboard } from "@/components/employer/SecurityDashboard";
import VerificationLimitWarning from "@/components/VerificationLimitWarning";
import ExportDataButton from "@/components/ExportDataButton";
import { UsagePanel } from "@/components/employer/UsagePanel";
import { UpgradeBanner } from "@/components/employer/UpgradeBanner";
import { UpgradeGate } from "@/components/employer/UpgradeGate";
import { ListedEmployeesCard } from "@/components/employer/ListedEmployeesCard";
import { EditCompanyInfo } from "@/components/employer/EditCompanyInfo";
import { EmployerProfileCompletionCard } from "@/components/employer/EmployerProfileCompletionCard";
import { CandidateViewHistoryCard } from "@/components/employer/CandidateViewHistoryCard";
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";
import { getVerticalConfig } from "@/lib/verticals/config";
import { runSimulation } from "@/lib/simulation/engine";
import type { PlanTier, SimulationOutput } from "@/lib/simulation/types";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

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
}

export function EmployerDashboardClient({
  userRole,
  planTier,
  employerId,
  employerIndustry,
  sandboxMode = false,
  sandboxId = null,
  showWelcome = false,
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

  const simulationOutput: SimulationOutput = {
    allowedReports: 40,
    allowedSearches: 50,
    seatsAllowed: 10,
    overLimit: false,
    subscriptionExpired: false,
    rehireProbability: 87,
    teamCompatibilityScore: 91,
    workforceRiskScore: 12,
  };

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
          <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 flex items-center justify-between gap-4">
            <p className="font-semibold text-green-800 dark:text-green-200">Account created successfully. You're all set.</p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setWelcomeDismissed(true);
                  router.replace("/employer/dashboard", { scroll: false });
                }}
              >
                Dismiss
              </Button>
              <Button size="sm" asChild>
                <Link href="/employer/profile">Complete company profile</Link>
              </Button>
            </div>
          </div>
        )}
        {isFreePlan && <UpgradeBanner />}

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
            Dashboard
          </h1>
          <p className="text-grey-medium dark:text-gray-400 mt-1">
            Welcome back. Manage candidates, verifications, and your subscription.
          </p>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <EditCompanyInfo />
            {planTier && (
              <>
                <span className="text-sm font-medium text-grey-medium dark:text-gray-400">
                  Current Plan:
                </span>
                <Badge
                variant="primary"
                className={
                  planTier === "custom"
                    ? "bg-amber-500 text-white border-amber-600 dark:bg-amber-600 dark:border-amber-700"
                    : planTier === "pro"
                    ? "bg-purple-600 text-white border-purple-700 dark:bg-purple-700 dark:border-purple-800"
                    : "bg-gray-500 text-white border-gray-600 dark:bg-gray-600 dark:border-gray-700"
                }
              >
                {planTier === "free" || !planTier
                  ? "FREE"
                  : planTier === "custom"
                  ? "CUSTOM"
                  : planTier === "pro"
                  ? "PRO"
                  : "STARTER"}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Plan & Usage */}
        <UsagePanel apiBaseUrl={sandboxMode ? apiBaseUrl : undefined} sandboxId={sandboxMode ? sandboxId ?? undefined : undefined} />

        {/* Vertical Intelligence (display only) */}
        {vertical && (
          <Card className="mt-6 border border-blue-500/40 bg-slate-900 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-white">
              {vertical.label}
            </h2>
            <p className="mt-2 text-sm text-slate-200">
              {vertical.description}
            </p>
            <div className="mt-4">
              <p className="font-medium text-blue-400">Highlighted Metrics</p>
              <ul className="mt-1 list-disc pl-6 text-sm text-white">
                {vertical.highlightMetrics.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <p className="font-medium text-red-400">Risk Signals</p>
              <ul className="mt-1 list-disc pl-6 text-sm text-white">
                {vertical.riskSignals.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </Card>
        )}

        {/* Employees Who Listed You */}
        <div className="mt-6">
          <ListedEmployeesCard apiBaseUrl={sandboxMode ? apiBaseUrl : undefined} sandboxId={sandboxMode ? sandboxId ?? undefined : undefined} />
        </div>

        {/* Company profile completion status (name, industry, location, verification) */}
        <div className="mt-6">
          <EmployerProfileCompletionCard />
        </div>

        {/* Candidate view history (placeholder until tracking exists) */}
        <div className="mt-6">
          <CandidateViewHistoryCard />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            id="onboarding-company-profile"
            variant="secondary"
            href="/employer/profile"
            className="h-auto p-4 flex flex-col items-start"
          >
            <PlusIcon className="h-6 w-6 mb-2" />
            <span className="font-semibold">Company profile</span>
            <span className="text-sm opacity-90">Complete your company details</span>
          </Button>
          <Button
            id="onboarding-add-team"
            variant="secondary"
            href="/employer/employees"
            className="h-auto p-4 flex flex-col items-start"
          >
            <MagnifyingGlassIcon className="h-6 w-6 mb-2" />
            <span className="font-semibold">Search Employees</span>
            <span className="text-sm opacity-90">
              View employees who list your company
            </span>
          </Button>
          <Button
            id="onboarding-request-verification"
            variant="secondary"
            href="/employer/candidates"
            className="h-auto p-4 flex flex-col items-start"
          >
            <MagnifyingGlassIcon className="h-6 w-6 mb-2" />
            <span className="font-semibold">Request verification</span>
            <span className="text-sm opacity-90">View candidates & request verification</span>
          </Button>
          {isFreePlan ? (
            <Button variant="secondary" className="h-auto p-4 flex flex-col items-start" asChild>
              <Link href="/employer/upgrade">
                <ArrowTrendingUpIcon className="h-6 w-6 mb-2" />
                <span className="font-semibold">Upgrade Plan</span>
                <span className="text-sm opacity-90">Unlock premium features</span>
              </Link>
            </Button>
          ) : (
            <Button
              variant="secondary"
              href="/pricing"
              className="h-auto p-4 flex flex-col items-start"
              onClick={(e) => {
                if (isBasicPlan) {
                  e.preventDefault();
                  setShowUpgradeModal(true);
                }
              }}
            >
              <ArrowTrendingUpIcon className="h-6 w-6 mb-2" />
              <span className="font-semibold">Upgrade Plan</span>
              <span className="text-sm opacity-90">Unlock premium features</span>
            </Button>
          )}
        </div>

        {/* Workforce Overview */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Workforce Overview
          </h2>
          {workforceStatsLoading ? (
            <p className="text-sm text-grey-medium dark:text-gray-400">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-grey-medium dark:text-gray-400">Total verified employees</p>
                <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">{workforceStats?.totalVerified ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-grey-medium dark:text-gray-400">Verification completion rate (30d)</p>
                <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">{workforceStats?.verificationCompletionRate != null ? `${workforceStats.verificationCompletionRate}%` : "—"}</p>
              </div>
              <div>
                <p className="text-sm text-grey-medium dark:text-gray-400">Dispute rate</p>
                <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">{workforceStats?.disputeRate != null ? `${workforceStats.disputeRate}%` : "—"}</p>
              </div>
              <div>
                <p className="text-sm text-grey-medium dark:text-gray-400">Rehire eligibility %</p>
                <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">{workforceStats?.rehireEligibilityPct != null ? `${workforceStats.rehireEligibilityPct}%` : "—"}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Workforce Risk Overview — Risk Band (no raw score), Avg, High Risk Count */}
        {(riskSnapshotEnabled || workforceDashboardEnabled) && !isFreePlan && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
              Workforce Risk Overview
            </h2>
            {riskOverviewLoading ? (
              <p className="text-sm text-grey-medium dark:text-gray-400">Loading…</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-grey-medium dark:text-gray-400">Avg workforce risk band</p>
                  <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">
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
                  <p className="text-sm text-grey-medium dark:text-gray-400">High risk count</p>
                  <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">{riskOverview?.workforceHighRiskCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-grey-medium dark:text-gray-400">Verification completion rate</p>
                  <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">{workforceStats?.verificationCompletionRate != null ? `${workforceStats.verificationCompletionRate}%` : "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-grey-medium dark:text-gray-400">Dispute rate</p>
                  <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">{workforceStats?.disputeRate != null ? `${workforceStats.disputeRate}%` : "—"}</p>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Alerts — approaching limits, disputes, verification gaps */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Alerts
          </h2>
          <div className="space-y-2">
            {workforceStatsLoading && (
              <p className="text-sm text-grey-medium dark:text-gray-400">Loading…</p>
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
              <p className="text-sm text-grey-medium dark:text-gray-400">No alerts. Add and verify employees to see alerts here.</p>
            )}
            {!workforceStatsLoading && (workforceStats?.totalVerified ?? 0) > 0 && (!workforceStats?.disputeRate || workforceStats.disputeRate <= 10) && (workforceStats?.verificationCompletionRate == null || workforceStats.verificationCompletionRate >= 50) && (!isBasicPlan || verificationCount < verificationLimit * 0.8) && (
              <p className="text-sm text-grey-medium dark:text-gray-400">No active alerts.</p>
            )}
          </div>
        </Card>

        {/* Candidate Oversight — recent checks, risk band distribution */}
        {(riskSnapshotEnabled || workforceDashboardEnabled) && !isFreePlan && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
              Candidate Oversight
            </h2>
            {riskOverviewLoading ? (
              <p className="text-sm text-grey-medium dark:text-gray-400">Loading…</p>
            ) : riskOverview?.riskSnapshotSample ? (
              <div className="space-y-4">
                <p className="text-sm text-grey-medium dark:text-gray-400">Recent check sample — risk band distribution</p>
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
                <p className="text-sm text-grey-medium dark:text-gray-400">
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
              <p className="text-sm text-grey-medium dark:text-gray-400">No candidate checks yet. Verified employees will appear here.</p>
            )}
          </Card>
        )}

        {/* Hiring Confidence — Pro only */}
        {planTier === "pro" && !isFreePlan && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
              Hiring Confidence
            </h2>
            <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">Pro: view hiring confidence indicators for your verified workforce.</p>
            <Button variant="secondary" href="/employer/candidates">View candidates</Button>
          </Card>
        )}

        {/* Team Fit — Pro / Enterprise only */}
        {(planTier === "pro" || planTier === "custom") && !isFreePlan && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
              Team Fit
            </h2>
            <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">See how candidates fit with your team based on verified data.</p>
            <Button variant="secondary" href="/employer/candidates">View team fit</Button>
          </Card>
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
            <AdvancedAnalytics simulation={simulationOutput} />
          </div>
        )}
        {!analyticsEnabled && (
          <div className="mt-6 rounded-xl border border-grey-background dark:border-[#374151] bg-white dark:bg-[#1A1F2B] p-6">
            <p className="text-sm text-grey-medium dark:text-gray-400">Unlock advanced analytics with a Pro plan.</p>
            <Button variant="primary" className="mt-3" onClick={() => setShowUpgradeModal(true)}>Upgrade to see analytics</Button>
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
              <Card className="p-6">
                <p className="text-sm text-grey-medium dark:text-gray-400">Loading rehire registry…</p>
              </Card>
            ) : (
              <RehireRegistrySection entries={rehireList} onRefresh={fetchRehireList} />
            )}
          </div>
        )}

        {/* Analytics Section */}
        <div id="onboarding-analytics" className="mt-8">
          {loadingAnalytics ? (
            <Card className="p-6">
              <p className="text-grey-medium dark:text-gray-400 text-center">
                Loading analytics...
              </p>
            </Card>
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
                    label="Export Reputation Scores"
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </>
  );
}
