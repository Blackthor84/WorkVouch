"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CheckCircleIcon, XCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export function AccountSafetyCard() {
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/user/me", { credentials: "include" })
      .then((r) => r.json())
      .then((body) => {
        setEmailVerified(body?.profile?.email_verified ?? null);
      })
      .catch(() => setEmailVerified(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-6 rounded-[20px] border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-[#1E293B] dark:text-slate-200 mb-3 flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-slate-500" />
          Account safety
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 rounded-[20px] border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-[#1E293B] dark:text-slate-200 mb-4 flex items-center gap-2">
        <ShieldCheckIcon className="h-5 w-5 text-slate-500" />
        Account safety
      </h3>
      <ul className="space-y-3 text-sm">
        <li className="flex items-center justify-between gap-2">
          <span className="text-slate-600 dark:text-slate-400">Email verification</span>
          {emailVerified === true ? (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircleIcon className="h-5 w-5" /> Verified
            </span>
          ) : emailVerified === false ? (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <XCircleIcon className="h-5 w-5" /> Not verified
            </span>
          ) : (
            <span className="text-slate-500">—</span>
          )}
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="text-slate-600 dark:text-slate-400">Password</span>
          <Link href="/forgot-password" className="text-blue-600 dark:text-blue-400 hover:underline shrink-0">
            Reset password
          </Link>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="text-slate-600 dark:text-slate-400">Account deletion</span>
          <Link href="/settings" className="text-blue-600 dark:text-blue-400 hover:underline shrink-0">
            Request in Settings
          </Link>
        </li>
      </ul>
    </Card>
  );
}
