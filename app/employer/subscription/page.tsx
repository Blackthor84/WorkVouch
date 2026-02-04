"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { EMPLOYER_PLANS } from "@/lib/pricing/employer-plans";

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("");
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    // Fetch current plan
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
    } catch (error: any) {
      alert(error.message || "Failed to start upgrade process");
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-grey-dark dark:text-gray-200">
          Manage Subscription
        </h1>
        <p className="text-grey-medium dark:text-gray-400 mb-8">
          Upgrade your plan to unlock premium features and unlimited
          verifications.
        </p>

        {loadingPlan ? (
          <Card className="p-8 text-center">
            <p className="text-grey-medium dark:text-gray-400">Loading...</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {EMPLOYER_PLANS.map((plan) => {
              const norm = (t: string) => t.toLowerCase().replace(/-/g, "_");
              const cur = norm(currentPlan);
              const isCurrentPlan =
                (plan.id === "starter" && ["lite", "starter", "free", "basic", "pay_per_use"].includes(cur)) ||
                (plan.id === "pro" && ["pro", "team", "security_bundle", "security_agency"].includes(cur)) ||
                (plan.id === "custom" && (cur === "custom" || cur === "enterprise"));
              return (
                <Card key={plan.id} className="p-8 relative">
                  {isCurrentPlan && (
                    <Badge variant="success" className="absolute top-4 right-4">
                      Current Plan
                    </Badge>
                  )}
                  <h2 className="text-2xl font-semibold mb-4 text-grey-dark dark:text-gray-200">
                    {plan.name}
                  </h2>
                  <p className="text-4xl font-bold mb-4 text-grey-dark dark:text-gray-200">
                    ${plan.priceMonthly}
                    <span className="text-lg text-grey-medium dark:text-gray-400">/mo</span>
                  </p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.slice(0, 5).map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-grey-dark dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading === plan.id || isCurrentPlan}
                    className="w-full"
                    variant={isCurrentPlan ? "secondary" : "primary"}
                  >
                    {loading === plan.id ? "Processing..." : isCurrentPlan ? "Current Plan" : `Upgrade to ${plan.name}`}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <Link href="/employer/dashboard">
            <Button variant="ghost">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
