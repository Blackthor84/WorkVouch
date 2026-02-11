"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserGroupIcon } from "@heroicons/react/24/outline";

interface ListingSummary {
  total_listed: number;
  verified: number;
  pending: number;
  disputed: number;
  average_profile_strength?: number;
}

interface ListedEmployeesCardProps {
  apiBaseUrl?: string;
  sandboxId?: string;
}

export function ListedEmployeesCard({ apiBaseUrl, sandboxId }: ListedEmployeesCardProps = {}) {
  const [summary, setSummary] = useState<ListingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const url = apiBaseUrl && sandboxId
    ? `${apiBaseUrl}/listing-summary?sandboxId=${encodeURIComponent(sandboxId)}`
    : "/api/employer/listing-summary";

  useEffect(() => {
    fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.total_listed != null) setSummary(data);
      })
      .catch((error) => { console.error("[SYSTEM_FAIL]", error); })
      .finally(() => setLoading(false));
  }, [url]);

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-grey-medium dark:text-gray-400">Loading…</p>
      </Card>
    );
  }

  const total = summary?.total_listed ?? 0;
  const verified = summary?.verified ?? 0;
  const pending = summary?.pending ?? 0;
  const disputed = summary?.disputed ?? 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 flex items-center gap-2">
          <UserGroupIcon className="h-5 w-5" />
          Employees Who Listed You
        </h3>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/employer/listed-employees">View all</Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">{total}</p>
          <p className="text-xs text-grey-medium dark:text-gray-400">Total listed</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{verified}</p>
          <p className="text-xs text-grey-medium dark:text-gray-400">Verified</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pending}</p>
          <p className="text-xs text-grey-medium dark:text-gray-400">Pending</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{disputed}</p>
          <p className="text-xs text-grey-medium dark:text-gray-400">Disputed</p>
        </div>
      </div>
      {summary?.average_profile_strength != null && (
        <p className="text-sm text-grey-medium dark:text-gray-400 mt-2">
          Avg profile strength: {summary.average_profile_strength}%
        </p>
      )}
    </Card>
  );
}
