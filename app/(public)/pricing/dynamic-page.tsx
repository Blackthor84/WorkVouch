"use client";

import { employerPlans, payPerUse } from "@/data/pricing";

export default function DynamicPricingPage() {
  const startCheckout = async (stripePriceId: string | undefined) => {
    if (!stripePriceId) {
      alert("Price ID not configured. Please contact support.");
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
    } catch (err: any) {
      alert("Checkout error: " + err.message);
    }
  };

  return (
    <div>
      <h1>Choose Your Plan</h1>
      {employerPlans.map((plan) => (
        <div key={plan.id}>
          <h3>{plan.name}</h3>
          <p>${plan.price}/{plan.period}</p>
          <button onClick={() => startCheckout(plan.stripePriceId)}>
            {plan.id === "starter" && "Start Hiring"}
            {plan.id === "team" && "Upgrade to Team"}
            {plan.id === "pro" && "Go Pro"}
            {plan.id === "security" && "Get Security Bundle"}
            {!["starter", "team", "pro", "security"].includes(plan.id) && "Choose Plan"}
          </button>
        </div>
      ))}
      <div>
        <h3>{payPerUse.name}</h3>
        <p>${payPerUse.price}/{payPerUse.period}</p>
        <button onClick={() => startCheckout(payPerUse.stripePriceId)}>
          Buy Report
        </button>
      </div>
    </div>
  );
}
