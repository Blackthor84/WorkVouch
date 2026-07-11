"use client";

import { WvButton } from "@/components/wv";

export function UpgradeBanner() {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 mb-6">
      <p className="text-sm font-medium text-amber-200 mb-3">
        Unlock verification reports and workforce intelligence.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <WvButton href="/employer/upgrade" size="sm">
          Upgrade to Lite
        </WvButton>
        <WvButton href="/employer/upgrade" size="sm">
          Upgrade to Pro
        </WvButton>
        <WvButton href="/contact" variant="secondary" size="sm">
          Contact Sales (Enterprise)
        </WvButton>
      </div>
    </div>
  );
}
