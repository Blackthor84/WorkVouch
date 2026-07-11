"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { WvPageHeader, WvCard, WvButton, WvBadge } from "@/components/wv";
import { EMPLOYER_PLANS } from "@/lib/pricing/employer-plans";

export function SubscriptionClient() {
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("");
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const response = await fetch("/api/employer/me");
        if (response.ok) {
          const data = await response.json();
          setCurrentPlan(data.planTier || "free");
        }
      } catch (error) {
        console.error("Failed to fetch plan:", error);
      } finally {
        setLoadingPlan(false);
      }
    }
    fetchPlan();
  }, []);

  async function handleUpgrade(plan: string) {
    if (plan === "custom") {
      window.location.href = "/contact";
      return;
    }
    setLoading(plan);
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planTier: plan }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout session");
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to start upgrade process");
      setLoading(null);
    }
  }

  return (
    <>
      <WvPageHeader
        eyebrow="Subscription"
        title="Manage Subscription"
        description="Upgrade your plan to unlock premium features and unlimited verifications."
      />

      {loadingPlan ? (
        <WvCard className="mt-8 text-center">
          <p className="text-wv-muted">Loading...</p>
        </WvCard>
      ) : (
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {EMPLOYER_PLANS.map((plan) => {
            const norm = (t: string) => t.toLowerCase().replace(/-/g, "_");
            const cur = norm(currentPlan);
            const isCurrentPlan =
              (plan.id === "starter" && ["lite", "starter", "free", "basic", "pay_per_use"].includes(cur)) ||
              (plan.id === "pro" && ["pro", "team", "security_bundle", "security_agency"].includes(cur)) ||
              (plan.id === "custom" && (cur === "custom" || cur === "enterprise"));
            return (
              <WvCard key={plan.id} hover glow={plan.id === "pro"} className="relative">
                {isCurrentPlan && (
                  <WvBadge variant="success" className="absolute top-4 right-4">
                    Current Plan
                  </WvBadge>
                )}
                <h2 className="text-2xl font-semibold text-wv-foreground">{plan.name}</h2>
                <p className="text-4xl font-bold mt-4 text-wv-foreground">
                  ${plan.priceMonthly}
                  <span className="text-lg text-wv-muted">/mo</span>
                </p>
                <ul className="space-y-3 my-6">
                  {plan.features.slice(0, 5).map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden />
                      <span className="text-sm text-wv-muted">{feature}</span>
                    </li>
                  ))}
                </ul>
                <WvButton
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading === plan.id || isCurrentPlan}
                  className="w-full"
                  variant={isCurrentPlan ? "secondary" : "primary"}
                >
                  {loading === plan.id ? "Processing..." : isCurrentPlan ? "Current Plan" : `Upgrade to ${plan.name}`}
                </WvButton>
              </WvCard>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <WvButton href="/employer/dashboard" variant="ghost">
          Back to Dashboard
        </WvButton>
      </div>
    </>
  );
}
