"use client";

import { useState, useEffect } from "react";
import { getUserSubscription } from "@/lib/actions/subscriptions";
import { WvCard, WvButton } from "@/components/wv";
import { openBillingPortal } from "@/lib/utils/stripe-helpers";
import { CreditCard } from "lucide-react";
import { usePreview } from "@/lib/preview-context";

export function EmployerBilling() {
  const { preview } = usePreview();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const simulateExpired = Boolean(preview?.simulateExpired);
  const demoStatus = preview?.subscriptionStatus;
  const trialEndsAt = preview?.trialEndsAt;

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const sub = await getUserSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error("Failed to load subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      await openBillingPortal();
    } catch (error: any) {
      alert(error.message || "Failed to open billing portal");
    }
  };

  if (loading) {
    return (
      <WvCard className="text-center">
        <p className="text-wv-muted">Loading subscription...</p>
      </WvCard>
    );
  }

  const isPro = subscription?.tier === "emp_pro";
  const realActive =
    subscription?.status === "active" || subscription?.status === "trialing";
  const isActive = simulateExpired ? false : realActive;
  const statusLabel = simulateExpired ? "expired (demo)" : (subscription?.status || "inactive");
  const trialEndMs = trialEndsAt ? new Date(trialEndsAt).getTime() : 0;
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  const trialUrgency = demoStatus === "trialing" && trialEndMs > 0 && trialEndMs - Date.now() < threeDaysMs && trialEndMs > Date.now();

  return (
    <div className="space-y-6">
      {simulateExpired && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 text-sm">
          <strong>Demo:</strong> Simulating expired subscription. Display only — no API changes.
        </div>
      )}
      {trialUrgency && !simulateExpired && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 text-sm">
          <strong>Trial ending soon</strong> — Your trial ends in less than 3 days. (Demo)
        </div>
      )}

      <WvCard glow>
        <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold text-wv-foreground mb-1">
              Current Plan:{" "}
              {subscription?.tier ? subscription.tier.replace("emp_", "").toUpperCase() : "None"}
            </h3>
            <p className="text-sm text-wv-muted">
              Status:{" "}
              <span className={`font-semibold capitalize ${isActive ? "text-emerald-400" : "text-red-400"}`}>
                {statusLabel}
              </span>
            </p>
          </div>
          {!isPro && <WvButton href="/pricing">Upgrade to Pro</WvButton>}
        </div>

        {isPro && (
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between gap-4">
              <span className="text-wv-muted">Features:</span>
              <span className="text-wv-foreground font-medium text-right">
                Unlimited profiles, references, messaging, job boosts
              </span>
            </div>
            {subscription?.current_period_end && (
              <div className="flex justify-between gap-4">
                <span className="text-wv-muted">Next billing date:</span>
                <span className="text-wv-foreground font-medium">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}

        <WvButton variant="secondary" onClick={handleManageBilling} className="w-full">
          <CreditCard className="h-4 w-4" aria-hidden />
          Manage Subscription
        </WvButton>
      </WvCard>

      {!isPro && (
        <WvCard>
          <h3 className="text-lg font-semibold text-wv-foreground mb-2">Upgrade to Employer Pro</h3>
          <p className="text-sm text-wv-muted mb-4">
            Get unlimited access to candidate profiles, references, messaging,
            and job posting boosts for $199/month.
          </p>
          <WvButton href="/pricing">View Plans</WvButton>
        </WvCard>
      )}
    </div>
  );
}
