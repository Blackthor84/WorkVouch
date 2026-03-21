"use client";

import Link from "next/link";

/**
 * Blur + CTA over trust/review premium content for free-tier employers.
 */
export function HiringDataUnlockGate({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl border border-slate-200/80 overflow-hidden min-h-[120px]">
      <div className="blur-sm pointer-events-none select-none opacity-60 scale-[0.99]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/70 via-white/85 to-white/95 dark:from-[#0D1117]/80 dark:via-[#0D1117]/90 dark:to-[#0D1117] backdrop-blur-[3px] px-4 py-8">
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            <span aria-hidden>🔒 </span>
            Upgrade to unlock full insights
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Unlock full trust breakdown with Pro—exact scores, references, and hiring intelligence for every
            candidate.
          </p>
          <Link
            href="/enterprise/upgrade"
            className="mt-4 inline-flex rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#1D4ED8]"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
