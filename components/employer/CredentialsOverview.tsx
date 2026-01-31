"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CredentialsSummary {
  activeCertifications: number;
  expiringCertifications: number;
  expiredCount: number;
  renewalsNeeded: number;
  complianceAlertCount: number;
  complianceDashboardEnabled: boolean;
}

interface CredentialsOverviewProps {
  /** When true, hide compliance section (plan does not allow). */
  showComplianceAlerts?: boolean;
}

export function CredentialsOverview({ showComplianceAlerts = false }: CredentialsOverviewProps) {
  const [summary, setSummary] = useState<CredentialsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employer/credentials-summary", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setSummary(null);
        else setSummary(data);
      })
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-grey-medium dark:text-gray-400">Loading credentials…</p>
      </Card>
    );
  }

  const s = summary ?? {
    activeCertifications: 0,
    expiringCertifications: 0,
    expiredCount: 0,
    renewalsNeeded: 0,
    complianceAlertCount: 0,
    complianceDashboardEnabled: false,
  };

  const hasAny = s.activeCertifications > 0 || s.expiringCertifications > 0 || s.renewalsNeeded > 0 || s.expiredCount > 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Credentials & Compliance</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-grey-dark dark:text-gray-200">Certifications & Training</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-grey-medium dark:text-gray-400">Active Certifications</p>
              <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">{s.activeCertifications}</p>
            </div>
            <div>
              <p className="text-xs text-grey-medium dark:text-gray-400">Expiring Certifications</p>
              <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">{s.expiringCertifications}</p>
            </div>
            <div>
              <p className="text-xs text-grey-medium dark:text-gray-400">Training Renewals Needed</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{s.renewalsNeeded}</p>
            </div>
            <div>
              <p className="text-xs text-grey-medium dark:text-gray-400">Expired</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{s.expiredCount}</p>
            </div>
          </div>
          {!hasAny && (
            <p className="mt-3 text-sm text-grey-medium dark:text-gray-400">
              Upload professional credentials to track certifications and renewals.
            </p>
          )}
        </CardContent>
      </Card>

      {showComplianceAlerts && s.complianceDashboardEnabled && (s.complianceAlertCount ?? 0) > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-900/20">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {s.complianceAlertCount} compliance alert(s) require attention.
          </p>
        </div>
      )}
    </div>
  );
}
