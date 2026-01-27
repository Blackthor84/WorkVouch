"use client";

import { useState } from "react";
import { employerPlans, payPerUse } from "@/data/pricing";

export default function EmployerPricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (stripePriceId: string | undefined) => {
    if (!stripePriceId) {
      alert("Price ID not configured. Please contact support.");
      return;
    }

    setLoadingPlan(stripePriceId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: stripePriceId }),
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
      <h1 className="text-4xl font-bold mb-6">WorkVouch Pricing for Employers</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {allPlans.map((plan) => (
          <div
            key={plan.id}
            className="border rounded p-6 shadow hover:shadow-lg transition"
          >
            <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
            <p className="text-xl font-bold mb-4">
              ${plan.price} / {plan.period}
            </p>
            <ul className="mb-4 list-disc ml-6 space-y-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="text-sm">{feature}</li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout(plan.stripePriceId)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 w-full transition-colors"
              disabled={loadingPlan === plan.stripePriceId}
            >
              {loadingPlan === plan.stripePriceId
                ? "Redirecting..."
                : plan.id === "pay_per_use"
                ? "Buy Report"
                : "Subscribe"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
