"use client";

import { useSearchParams } from "next/navigation";
import { WvCard, WvButton, WvPageHeader } from "@/components/wv";
import { EMPLOYER_PLANS } from "@/lib/pricing/employer-plans";

export default function UpgradeClient() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");

  return (
    <>
      <WvPageHeader
        eyebrow="Plans"
        title="Upgrade your plan"
        description="Unlock verification reports, workforce intelligence, and higher search limits."
      />
      {plan && (
        <WvCard className="mt-6 border-blue-500/30 bg-blue-500/10">
          <p className="text-sm text-blue-300">
            Selected plan: <strong>{plan}</strong>
          </p>
        </WvCard>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {EMPLOYER_PLANS.map((p) => (
          <WvCard key={p.id} hover glow={p.id === "pro"}>
            <h2 className="text-lg font-bold text-wv-foreground">{p.name}</h2>
            <p className="text-2xl font-bold text-wv-foreground mt-2">
              ${p.priceMonthly}
              <span className="text-sm font-normal text-wv-muted">/mo</span>
            </p>
            <WvButton
              href={p.id === "custom" ? "/contact" : `/signup?plan_tier=${p.id}`}
              className="mt-4 w-full"
              size="sm"
            >
              {p.id === "custom" ? "Contact Sales" : `Choose ${p.name}`}
            </WvButton>
          </WvCard>
        ))}
      </div>
    </>
  );
}
