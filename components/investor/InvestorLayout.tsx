"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface InvestorLayoutProps {
  children: ReactNode;
}

export default function InvestorLayout({ children }: InvestorLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0a0e14] text-slate-200">
      <div className="sticky top-0 z-50 border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center">
        <span className="text-sm font-semibold uppercase tracking-wider text-amber-400">
          Enterprise Simulation Mode — Boardroom use only. Not user-facing.
        </span>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Investor Demo
          </h1>
          <Link
            href="/admin"
            className="rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/80"
          >
            Back to Admin
          </Link>
        </div>

        <div className="space-y-10">{children}</div>
      </div>
    </div>
  );
}
