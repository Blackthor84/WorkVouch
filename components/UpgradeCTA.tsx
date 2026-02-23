"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type UpgradeCTAProps = {
  feature: string;
};

/** Central upgrade CTA for paywalls. Deep link to /billing; no Stripe pricing logic. */
export function UpgradeCTA({ feature }: UpgradeCTAProps) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-4">
      <h4 className="font-semibold text-slate-900">Unlock {feature}</h4>
      <p className="mt-1 text-sm text-slate-600">
        Upgrade your plan to access this feature.
      </p>
      <Link href="/billing" className="mt-3 inline-block">
        <Button size="sm">Upgrade</Button>
      </Link>
    </div>
  );
}
