"use client";

import { employerPlans } from "@/data/pricing";

const validStripePriceIds = new Set(
  employerPlans.flatMap((p) => {
    const ids: string[] = [];
    if (p.stripePriceIdMonthly) ids.push(p.stripePriceIdMonthly);
    if (p.stripePriceIdYearly) ids.push(p.stripePriceIdYearly);
    return ids;
  })
);

export default function DynamicPricingPage() {
  const startCheckout = async (stripePriceId: string | undefined) => {
    if (!stripePriceId) {
      alert("Price ID not configured. Please contact support.");
      return;
    }
    if (!validStripePriceIds.has(stripePriceId)) {
      alert("Invalid plan. Please choose Starter or Pro.");
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: stripePriceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Checkout failed: " + (data.error || "Unknown error"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert("Checkout error: " + message);
    }
  };

  return (
    <div>
      <h1>Choose Your Plan</h1>
      {employerPlans.map((plan) => (
        <div key={plan.id}>
          <h3>{plan.name}</h3>
          <p>${plan.price}/{plan.period}</p>
          {plan.ctaHref ? (
            <a href={plan.ctaHref}>{plan.cta}</a>
          ) : (
            <button
              onClick={() => {
                const priceId = plan.stripePriceIdMonthly;
                if (!priceId) return;
                startCheckout(priceId);
              }}
              disabled={!plan.stripePriceIdMonthly}
            >
              {plan.cta}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
