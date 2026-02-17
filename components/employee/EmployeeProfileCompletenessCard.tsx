"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

type Completeness = {
  hasName: boolean;
  hasEmail: boolean;
  jobsCount: number;
  referencesCount: number;
};

export function EmployeeProfileCompletenessCard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Completeness | null>(null);

  useEffect(() => {
    fetch("/api/user/profile-completeness", { credentials: "include" })
      .then((r) => r.json())
      .then((body) => {
        if (body?.hasName !== undefined) {
          setData({
            hasName: !!body.hasName,
            hasEmail: !!body.hasEmail,
            jobsCount: typeof body.jobsCount === "number" ? body.jobsCount : 0,
            referencesCount: typeof body.referencesCount === "number" ? body.referencesCount : 0,
          });
        } else {
          setData(null);
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-6 rounded-[20px] border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-[#1E293B] dark:text-slate-200 mb-3">
          Profile completeness
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-6 rounded-[20px] border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-[#1E293B] dark:text-slate-200 mb-3">
          Profile completeness
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Unable to load. You can complete your profile from the links below.
        </p>
        <Link href="/profile" className="mt-2 inline-block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
          Edit profile
        </Link>
      </Card>
    );
  }

  const sections = [
    {
      done: data.hasName,
      label: "Name",
      href: "/profile",
      action: "Add name",
    },
    {
      done: data.hasEmail,
      label: "Email",
      href: "/profile",
      action: "Add email",
    },
    {
      done: data.jobsCount > 0,
      label: "Job history",
      count: data.jobsCount,
      href: "/profile#jobs",
      action: "Add job",
    },
    {
      done: data.referencesCount > 0,
      label: "References / confirmations",
      count: data.referencesCount,
      href: "/coworker-matches",
      action: "Request confirmation",
    },
  ];

  return (
    <Card className="p-6 rounded-[20px] border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-[#1E293B] dark:text-slate-200 mb-4">
        Profile completeness
      </h3>
      <ul className="space-y-3">
        {sections.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              {s.done ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0" />
              )}
              <span className={s.done ? "text-[#1E293B] dark:text-slate-200" : "text-slate-600 dark:text-slate-400"}>
                {s.label}
                {s.count != null && s.count > 0 && (
                  <span className="ml-1 font-medium">({s.count})</span>
                )}
              </span>
            </div>
            {!s.done && (
              <Link
                href={s.href}
                className="shrink-0 text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                {s.action}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

