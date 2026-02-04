"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function UpgradeBanner() {
  return (
    <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 dark:border-amber-500/30 dark:bg-amber-500/5 px-4 py-4 mb-6">
      <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-3">
        Unlock verification reports and workforce intelligence.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" asChild>
          <Link href="/employer/upgrade">Upgrade to Lite</Link>
        </Button>
        <Button variant="primary" size="sm" asChild>
          <Link href="/employer/upgrade">Upgrade to Pro</Link>
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/contact">Contact Sales (Enterprise)</Link>
        </Button>
      </div>
    </div>
  );
}
