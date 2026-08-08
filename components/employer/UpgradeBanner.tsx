"use client";

import { WvButton } from "@/components/wv";

export function UpgradeBanner() {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 mb-6">
      <p className="text-sm font-medium text-amber-200 mb-3">
        Upgrade for verification reports and workforce analytics.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <WvButton href="/employer/upgrade" size="sm">
          Lite
        </WvButton>
        <WvButton href="/employer/upgrade" size="sm">
          Pro
        </WvButton>
        <WvButton href="/contact" variant="secondary" size="sm">
          Contact sales
        </WvButton>
      </div>
    </div>
  );
}
