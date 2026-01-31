"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SecurityDashboardProps {
  employerId?: string | null;
}

interface SecuritySummary {
  reportsUsedThisMonth: number;
  reportsLimit: number;
  expiringLicensesCount: number;
  expiredLicensesCount: number;
  suspendedLicensesCount: number;
  totalActiveLicenses: number;
  highRiskEmployeesCount: number;
  pendingVerificationsCount: number;
  internalNotesCount: number;
  expiredAlertsCount: number;
  warning30DayCount: number;
  topCredentialScores: { user_id: string; full_name: string | null; guard_credential_score: number }[];
}

export function SecurityDashboard({ employerId: _employerId }: SecurityDashboardProps) {
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/employer/usage", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/employer/security-summary", { credentials: "include" }).then((r) => r.json()).catch(() => ({})),
    ])
      .then(([usage, security]) => {
        setSummary({
          reportsUsedThisMonth: usage?.reportsUsed ?? 0,
          reportsLimit: security?.reportsLimit ?? 80,
          expiringLicensesCount: security?.expiringLicensesCount ?? 0,
          expiredLicensesCount: security?.expiredLicensesCount ?? 0,
          suspendedLicensesCount: security?.suspendedLicensesCount ?? 0,
          totalActiveLicenses: security?.totalActiveLicenses ?? 0,
          highRiskEmployeesCount: security?.highRiskEmployeesCount ?? 0,
          pendingVerificationsCount: security?.pendingVerificationsCount ?? 0,
          internalNotesCount: security?.internalNotesCount ?? 0,
          expiredAlertsCount: security?.expiredAlertsCount ?? 0,
          warning30DayCount: security?.warning30DayCount ?? 0,
          topCredentialScores: security?.topCredentialScores ?? [],
        });
      })
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-grey-medium dark:text-gray-400">Loading Security Dashboard…</p>
      </Card>
    );
  }

  const s = summary ?? {
    reportsUsedThisMonth: 0,
    reportsLimit: 80,
    expiringLicensesCount: 0,
    expiredLicensesCount: 0,
    suspendedLicensesCount: 0,
    totalActiveLicenses: 0,
    highRiskEmployeesCount: 0,
    pendingVerificationsCount: 0,
    internalNotesCount: 0,
    expiredAlertsCount: 0,
    warning30DayCount: 0,
    topCredentialScores: [],
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">Security Agency Dashboard</h2>

      {/* Compliance Alerts Panel */}
      {(s.expiredAlertsCount > 0 || s.warning30DayCount > 0) && (
        <div className="space-y-2">
          {s.expiredAlertsCount > 0 && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                {s.expiredAlertsCount} expired license(s) — action required.
              </p>
            </div>
          )}
          {s.warning30DayCount > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-900/20">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {s.warning30DayCount} license(s) expiring within 30 days.
              </p>
            </div>
          )}
        </div>
      )}

      {/* License Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-grey-dark dark:text-gray-200">License Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-grey-medium dark:text-gray-400">Total Active</p>
              <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">{s.totalActiveLicenses}</p>
            </div>
            <div>
              <p className="text-xs text-grey-medium dark:text-gray-400">Expiring in 30 days</p>
              <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">{s.expiringLicensesCount}</p>
            </div>
            <div>
              <p className="text-xs text-grey-medium dark:text-gray-400">Expired</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{s.expiredLicensesCount}</p>
            </div>
            <div>
              <p className="text-xs text-grey-medium dark:text-gray-400">Suspended</p>
              <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">{s.suspendedLicensesCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification usage (80 monthly cap) + other metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-grey-medium dark:text-gray-400">Reports used this month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">
              {s.reportsUsedThisMonth} <span className="text-sm font-normal text-grey-medium">/ {s.reportsLimit}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-grey-medium dark:text-gray-400">High-risk guards (score &lt; 50)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">{s.highRiskEmployeesCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-grey-medium dark:text-gray-400">Pending verifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">{s.pendingVerificationsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-grey-medium dark:text-gray-400">Internal notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">{s.internalNotesCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-grey-medium dark:text-gray-400">Compliance alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">
              {s.expiredAlertsCount + s.warning30DayCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Highest Credential Scores */}
      {s.topCredentialScores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-grey-dark dark:text-gray-200">Top 5 Credential Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {s.topCredentialScores.map((row, i) => (
                <li key={row.user_id} className="flex items-center justify-between rounded-lg bg-grey-background dark:bg-[#1A1F2B] px-3 py-2">
                  <span className="text-sm font-medium text-grey-dark dark:text-gray-200">
                    {i + 1}. {row.full_name ?? "Unknown"}
                  </span>
                  <Badge variant="default">{row.guard_credential_score}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
