"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { getProfileVisibilityStats } from "@/lib/actions/profile-visibility-stats";
import type { ProfileVisibilityStats } from "@/lib/actions/profile-visibility-stats";

export function ProfileVisibilityCard() {
  const [stats, setStats] = useState<ProfileVisibilityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getProfileVisibilityStats()
      .then((data) => {
        if (!cancelled) setStats(data ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <Card className="rounded-[20px] border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <h2 className="text-lg font-semibold text-[#1E293B] dark:text-slate-200">Profile Visibility</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="rounded-[20px] border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <h2 className="text-lg font-semibold text-[#1E293B] dark:text-slate-200">Profile Visibility</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Unable to load visibility stats.</p>
      </Card>
    );
  }

  return (
    <Card className="rounded-[20px] border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
      <h2 className="text-lg font-semibold text-[#1E293B] dark:text-slate-200">Profile Visibility</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        How often employers have seen your profile in directory search results. No individual employer names are shown.
      </p>
      <ul className="mt-4 space-y-3">
        <li className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Employer searches including you</span>
          <span className="font-medium text-slate-900 dark:text-slate-200">{stats.employerSearchCount}</span>
        </li>
        <li className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Industry types viewing</span>
          <span className="font-medium text-slate-900 dark:text-slate-200">
            {stats.industryTypes.length ? stats.industryTypes.join(", ") : "—"}
          </span>
        </li>
        <li className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Last viewed (date)</span>
          <span className="font-medium text-slate-900 dark:text-slate-200">
            {stats.lastViewedDate ?? "—"}
          </span>
        </li>
      </ul>
    </Card>
  );
}
