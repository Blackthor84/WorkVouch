"use client";

import { useState, useEffect } from "react";
import { getUserSubscription } from "@/lib/actions/subscriptions";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { openBillingPortal } from "@/lib/utils/stripe-helpers";
import { CreditCardIcon } from "@heroicons/react/24/outline";
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
      <Card className="p-12 text-center">
        <p className="text-grey-medium dark:text-gray-400">
          Loading subscription...
        </p>
      </Card>
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
        <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200 text-sm">
          <strong>Demo:</strong> Simulating expired subscription. Display only — no API changes.
        </div>
      )}
      {trialUrgency && !simulateExpired && (
        <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 text-amber-800 dark:text-amber-200 text-sm">
          <strong>Trial ending soon</strong> — Your trial ends in less than 3 days. (Demo)
        </div>
      )}
      <div>
        <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
          Billing & Subscription
        </h2>
        <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">
          Manage your subscription and billing information
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-1">
              Current Plan:{" "}
              {subscription?.tier
                ? subscription.tier.replace("emp_", "").toUpperCase()
                : "None"}
            </h3>
            <p className="text-sm text-grey-medium dark:text-gray-400">
              Status:{" "}
              <span
                className={`font-semibold capitalize ${
                  isActive
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {statusLabel}
              </span>
            </p>
          </div>
          {!isPro && <Button href="/pricing">Upgrade to Pro</Button>}
        </div>

        {isPro && (
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-grey-medium dark:text-gray-400">
                Features:
              </span>
              <span className="text-grey-dark dark:text-gray-200 font-medium">
                Unlimited profiles, references, messaging, job boosts
              </span>
            </div>
            {subscription?.current_period_end && (
              <div className="flex justify-between">
                <span className="text-grey-medium dark:text-gray-400">
                  Next billing date:
                </span>
                <span className="text-grey-dark dark:text-gray-200 font-medium">
                  {new Date(
                    subscription.current_period_end,
                  ).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}

        <Button
          variant="secondary"
          onClick={handleManageBilling}
          className="w-full"
        >
          <CreditCardIcon className="h-5 w-5 mr-2" />
          Manage Subscription
        </Button>
      </Card>

      {!isPro && (
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-2">
            Upgrade to Employer Pro
          </h3>
          <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
            Get unlimited access to candidate profiles, references, messaging,
            and job posting boosts for $199/month.
          </p>
          <Button href="/pricing">View Plans</Button>
        </Card>
      )}
    </div>
  );
}
