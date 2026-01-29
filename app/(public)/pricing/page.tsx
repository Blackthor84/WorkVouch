"use client";

import { useState } from "react";
import { employerPlans, payPerUse } from "@/data/pricing";
import Link from "next/link";

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (plan: typeof employerPlans[0] | typeof payPerUse) => {
    setLoadingPlan(plan.id);
    try {
      // Use GET request with plan query parameter
      const planSlug = plan.id === "one_time" ? "one_time" : plan.id;
      const res = await fetch(`/api/pricing/checkout?plan=${planSlug}`, {
        method: "GET",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout failed: " + (data.error || "Unknown error"));
        setLoadingPlan(null);
      }
    } catch (err: any) {
      console.error(err);
      alert("Checkout failed. Please try again.");
      setLoadingPlan(null);
    }
  };

  const allPlans = [...employerPlans, payPerUse];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">WorkVouch Pricing for Employers</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Choose the plan that fits your hiring needs
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allPlans.map((plan) => (
          <div
            key={plan.id}
            className="border rounded-lg p-6 shadow hover:shadow-lg transition bg-white dark:bg-gray-800"
          >
            <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
            <p className="text-xl font-bold mb-4">
              ${plan.price} / {plan.period}
            </p>
            <ul className="mb-6 list-disc ml-6 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {plan.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout(plan)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 w-full transition-colors font-semibold"
              disabled={loadingPlan === plan.stripePriceId}
            >
              {loadingPlan === plan.id
                ? "Redirecting..."
                : plan.id === "one_time"
                ? "Buy Report"
                : plan.id === "starter"
                ? "Start Hiring"
                : plan.id === "team"
                ? "Upgrade to Team"
                : plan.id === "pro"
                ? "Go Pro"
                : plan.id === "security"
                ? "Get Security Bundle"
                : "Subscribe"}
            </button>
          </div>
        ))}
      </div>
      <div className="mt-12 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Looking for employee features?{" "}
          <Link href="/subscribe/employee" className="text-blue-600 hover:underline">
            WorkVouch is always free for workers
          </Link>
        </p>
      </div>
    </div>
  );
}
