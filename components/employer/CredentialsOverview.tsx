"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

interface CredentialsOverviewProps {
  showComplianceAlerts?: boolean;
}

interface CredentialRow {
  id: string;
  profile_id: string;
  type: string;
  expiration_date: string | null;
  verified: boolean;
}

export default function CredentialsOverview({
  showComplianceAlerts = true,
}: CredentialsOverviewProps) {
  const [active, setActive] = useState(0);
  const [expiringSoon, setExpiringSoon] = useState(0);
  const [expired, setExpired] = useState(0);
  const [avgScore, setAvgScore] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      const today = new Date();
      const soon = new Date();
      soon.setDate(today.getDate() + 30);

      const { data: creds } = await supabaseBrowser
        .from("employee_credentials")
        .select("*");

      if (creds) {
        const credentialRows = creds as CredentialRow[];

        let activeCount = 0;
        let soonCount = 0;
        let expiredCount = 0;

        credentialRows.forEach((c) => {
          if (!c.expiration_date) {
            activeCount++;
            return;
          }

          const expDate = new Date(c.expiration_date);

          if (expDate < today) {
            expiredCount++;
          } else if (expDate <= soon) {
            soonCount++;
            activeCount++;
          } else {
            activeCount++;
          }
        });

        setActive(activeCount);
        setExpiringSoon(soonCount);
        setExpired(expiredCount);
      }

      const { data: profiles } = await supabaseBrowser
        .from("profiles")
        .select("guard_credential_score");

      if (profiles && profiles.length > 0) {
        const scores = profiles
          .map((p: { guard_credential_score?: number | null }) => p.guard_credential_score)
          .filter((s: number | null | undefined): s is number => typeof s === "number");

        if (scores.length > 0) {
          const avg =
            Math.round(
              (scores.reduce((a: number, b: number) => a + b, 0) /
                scores.length) *
                10
            ) / 10;

          setAvgScore(avg);
        }
      }
    }

    loadData();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-800">
      <h3 className="text-lg font-semibold mb-4">
        Workforce Credentials Overview
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <Stat label="Active Certifications" value={active} />
        <Stat label="Expiring Soon (30d)" value={expiringSoon} />
        <Stat label="Expired" value={expired} />
        <Stat label="Avg Credential Score" value={avgScore ?? "—"} />
      </div>

      {showComplianceAlerts && expired > 0 && (
        <div className="mt-6 text-sm text-red-600">
          {expired} credentials expired. Immediate compliance action required.
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
