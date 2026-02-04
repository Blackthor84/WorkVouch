"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
import CredentialsOverview from "@/components/employer/CredentialsOverview";
import { UpgradeBanner } from "@/components/employer/UpgradeBanner";
import { UpgradeGate } from "@/components/employer/UpgradeGate";
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";
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
}

export function EmployerDashboardClient({
  userRole,
  planTier,
  employerId,
}: EmployerDashboardClientProps) {
  const { enabled: analyticsEnabled } = useFeatureFlag("advanced_analytics");
  const { enabled: rehireWidgetEnabled } = useFeatureFlag("rehire_probability_index");
  const { enabled: workforceRiskEnabled } = useFeatureFlag("workforce_risk_indicator");
  const { enabled: riskSnapshotEnabled } = useFeatureFlag("risk_snapshot");
  const { enabled: workforceDashboardEnabled } = useFeatureFlag("workforce_dashboard");
  const { enabled: rehireSystemEnabled } = useFeatureFlag("rehire_system");
  const { enabled: riskDashboardEnabled } = useFeatureFlag("workforce_risk_dashboard");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
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
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [rehireCount, setRehireCount] = useState<number | null>(null);
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
      .catch(() => {})
      .finally(() => setRiskOverviewLoading(false));
  }, [riskSnapshotEnabled, workforceDashboardEnabled]);

  const fetchRehireList = useCallback(() => {
    setRehireListLoading(true);
    fetch("/api/employer/rehire", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.data)) setRehireList(data.data);
      })
      .catch(() => {})
      .finally(() => setRehireListLoading(false));
  }, []);

  useEffect(() => {
    if (!rehireSystemEnabled) return;
    fetchRehireList();
  }, [rehireSystemEnabled, fetchRehireList]);

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

  // Mock data
  const recentActivity = [
    {
      id: 1,
      type: "application",
      message: "New application for Security Guard position",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "message",
      message: "Message from John Doe",
      time: "5 hours ago",
    },
    {
      id: 3,
      type: "candidate",
      message: "New candidate saved: Jane Smith",
      time: "1 day ago",
    },
  ];

  const stats = [
    { label: "Active Jobs", value: "12", change: "+3" },
    { label: "Applications", value: "48", change: "+12" },
    { label: "Saved Candidates", value: "24", change: "+5" },
    { label: "Messages", value: "8", change: "+2" },
  ];

  return (
    <>
      {isBasicPlan && showUpgradeModal && (
        <UpgradeModal
          feature="Pro Features"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {isFreePlan && <UpgradeBanner />}

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
            Dashboard
          </h1>
          <p className="text-grey-medium dark:text-gray-400 mt-1">
            Welcome back. Manage candidates, verifications, and your subscription.
          </p>
          {planTier && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-medium text-grey-medium dark:text-gray-400">
                Current Plan:
              </span>
              <Badge
                variant="default"
                className={
                  planTier === "security_bundle" || planTier === "security-bundle"
                    ? "bg-amber-500 text-white border-amber-600 dark:bg-amber-600 dark:border-amber-700"
                    : planTier === "pro"
                    ? "bg-purple-600 text-white border-purple-700 dark:bg-purple-700 dark:border-purple-800"
                    : planTier === "team"
                    ? "bg-blue-600 text-white border-blue-700 dark:bg-blue-700 dark:border-blue-800"
                    : planTier === "starter"
                    ? "bg-gray-500 text-white border-gray-600 dark:bg-gray-600 dark:border-gray-700"
                    : "bg-gray-400 text-white border-gray-500 dark:bg-gray-500 dark:border-gray-600"
                }
              >
                {planTier === "free" || !planTier
                  ? "FREE"
                  : planTier === "enterprise"
                  ? "ENTERPRISE"
                  : planTier === "pro" || planTier === "team" || planTier === "security_bundle" || planTier === "security-bundle"
                  ? "PRO"
                  : "LITE"}
              </Badge>
            </div>
          )}
        </div>

        {/* Pro Features (only visible for Pro) */}
        {!isBasicPlan && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-grey-dark dark:text-gray-200">
                Reputation Score
              </h3>
              <p className="text-3xl font-bold text-grey-dark dark:text-gray-200">
                {trustScore ?? "N/A"}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-grey-dark dark:text-gray-200">
                Rehire Count
              </h3>
              <p className="text-3xl font-bold text-grey-dark dark:text-gray-200">
                {rehireCount ?? "N/A"}
              </p>
            </Card>
          </div>
        )}

        {/* Enterprise / Security Agency Dashboard variant (legacy security_bundle → pro) */}
        {(planTier === "enterprise" || planTier === "security_agency" || planTier === "security_bundle" || planTier === "security-bundle") && (
          <div className="mt-6">
            <SecurityDashboard employerId={employerId ?? null} />
          </div>
        )}

        {/* Universal credentials overview (Lite / Pro non–Security) */}
        {!(planTier === "enterprise" || planTier === "security_agency" || planTier === "security_bundle" || planTier === "security-bundle") && (
          <div className="mt-6">
            <CredentialsOverview showComplianceAlerts={false} />
          </div>
        )}

        {/* Usage Panel */}
        <UsagePanel />

        {/* Workforce Integrity Dashboard (feature-gated; free tier sees upgrade gate) */}
        {isFreePlan ? (
          <div className="mt-6">
            <UpgradeGate feature="Workforce Risk Dashboard" />
          </div>
        ) : riskDashboardEnabled ? (
          <div className="mt-6">
            <WorkforceRiskDashboard />
          </div>
        ) : null}

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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-grey-medium dark:text-gray-400">
                  {stat.label}
                </p>
                <Badge variant="success">{stat.change}</Badge>
              </div>
              <p className="text-3xl font-bold text-grey-dark dark:text-gray-200">
                {stat.value}
              </p>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
              Recent Activity
            </h2>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-grey-background dark:bg-[#1A1F2B]"
              >
                <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-2" />
                <div className="flex-1">
                  <p className="text-sm text-grey-dark dark:text-gray-200">
                    {activity.message}
                  </p>
                  <p className="text-xs text-grey-medium dark:text-gray-400 mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

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

        {/* Risk Intelligence v1 — Candidate Risk Snapshot (feature-flagged; gated for free) */}
        {riskSnapshotEnabled && (
          <div className="mt-6">
            {isFreePlan ? (
              <UpgradeGate feature="Candidate Risk Snapshot" />
            ) : (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-grey-dark dark:text-gray-200">
                Candidate Risk Snapshot
              </h3>
              {riskOverviewLoading ? (
                <p className="text-sm text-grey-medium dark:text-gray-400">Loading…</p>
              ) : riskOverview?.riskSnapshotSample ? (
                <div className="space-y-4">
                  <div className="flex items-baseline gap-4 flex-wrap">
                    <span className="text-4xl font-bold text-grey-dark dark:text-gray-200">
                      {Math.round(riskOverview.riskSnapshotSample.overall ?? 0)}
                    </span>
                    <span className="text-sm text-grey-medium dark:text-gray-400">
                      Overall score (0–100)
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-grey-medium dark:text-gray-400">Confidence </span>
                    <span className="font-semibold text-grey-dark dark:text-gray-200">
                      {Math.round(riskOverview.riskSnapshotSample.confidence ?? 0)}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Tenure", value: riskOverview.riskSnapshotSample.tenure ?? 0 },
                      { label: "References", value: riskOverview.riskSnapshotSample.references ?? 0 },
                      { label: "Disputes", value: riskOverview.riskSnapshotSample.disputes ?? 0 },
                      { label: "Gaps", value: riskOverview.riskSnapshotSample.gaps ?? 0 },
                      { label: "Rehire", value: riskOverview.riskSnapshotSample.rehire ?? 0 },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="text-sm text-grey-medium dark:text-gray-400 w-24">{label}</span>
                        <div className="flex-1 h-2 rounded-full bg-grey-background dark:bg-[#374151] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-600 dark:bg-blue-400"
                            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-grey-dark dark:text-gray-200 w-8">
                          {Math.round(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-grey-medium dark:text-gray-400">
                  No sample data yet. Profile strength is computed when you have verified employees in the rehire registry.
                </p>
              )}
            </Card>
            )}
          </div>
        )}

        {/* Risk Intelligence v1 — Workforce Risk Overview (feature-flagged; gated for free) */}
        {workforceDashboardEnabled && (
          <div className="mt-6">
            {isFreePlan ? (
              <UpgradeGate feature="Workforce Integrity Overview" />
            ) : (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-grey-dark dark:text-gray-200">
                Workforce Integrity Overview
              </h3>
              {riskOverviewLoading ? (
                <p className="text-sm text-grey-medium dark:text-gray-400">Loading…</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-grey-medium dark:text-gray-400">Average Risk Score</p>
                      <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">
                        {riskOverview?.workforceRiskAverage != null
                          ? Math.round(riskOverview.workforceRiskAverage)
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-grey-medium dark:text-gray-400">High Risk Count (score &lt; 50)</p>
                      <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">
                        {riskOverview?.workforceHighRiskCount ?? 0}
                      </p>
                    </div>
                  </div>
                  {riskOverview?.workforceRiskConfidence != null && (
                    <p className="text-sm text-grey-medium dark:text-gray-400">
                      Workforce confidence: {Math.round(riskOverview.workforceRiskConfidence)}%
                    </p>
                  )}
                  {riskOverview?.workforceLastCalculated && (
                    <p className="text-xs text-grey-medium dark:text-gray-500">
                      Last calculated: {new Date(riskOverview.workforceLastCalculated).toLocaleString()}
                    </p>
                  )}
                  <div className="h-12 rounded-lg border border-grey-background dark:border-[#374151] flex items-center justify-center text-sm text-grey-medium dark:text-gray-500">
                    Trend placeholder
                  </div>
                </div>
              )}
            </Card>
            )}
          </div>
        )}

        {/* Risk Intelligence v1 — Rehire Registry (feature-flagged; gated for free) */}
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
