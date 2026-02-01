"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Replace PRICE_ID_* placeholders with your Stripe Price IDs, or set NEXT_PUBLIC_STRIPE_PRICE_*_MONTHLY / *_YEARLY in env.
const plans = [
  {
    id: "starter",
    name: "Starter",
    positioning: "Verify before you hire.",
    prices: {
      monthly: {
        amount: 49,
        stripePriceId:
          typeof process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY === "string"
            ? process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY
            : process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "PRICE_ID_STARTER_MONTHLY",
      },
      yearly: {
        amount: 490,
        stripePriceId:
          typeof process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY === "string"
            ? process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY
            : "PRICE_ID_STARTER_YEARLY",
      },
    },
    lookups: "5 verified candidate lookups per month",
    features: [
      "Verified job history access",
      "Peer reference viewing",
      "Standard WorkVouch Trust Score",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    positioning: "Make every hire a confident one.",
    prices: {
      monthly: {
        amount: 149,
        stripePriceId:
          typeof process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH_MONTHLY === "string"
            ? process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH_MONTHLY
            : process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM ?? "PRICE_ID_GROWTH_MONTHLY",
      },
      yearly: {
        amount: 1490,
        stripePriceId:
          typeof process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH_YEARLY === "string"
            ? process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH_YEARLY
            : "PRICE_ID_GROWTH_YEARLY",
      },
    },
    lookups: "25 verified lookups per month",
    features: [
      "Everything in Starter",
      "Automated reference requests",
      "Enhanced trust analytics",
      "Downloadable verification reports",
      "Priority support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    positioning: "Enterprise-level hiring intelligence.",
    prices: {
      monthly: {
        amount: 399,
        stripePriceId:
          typeof process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY === "string"
            ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
            : process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? "PRICE_ID_PRO_MONTHLY",
      },
      yearly: {
        amount: 3990,
        stripePriceId:
          typeof process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY === "string"
            ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY
            : "PRICE_ID_PRO_YEARLY",
      },
    },
    lookups: "Unlimited lookups",
    features: [
      "Everything in Growth",
      "Bulk verification tools",
      "API access",
      "Team admin controls",
      "Advanced fraud detection insights",
      "Onboarding call",
    ],
  },
];

const faqs: { q: string; a: string }[] = [
  {
    q: "What is a Trust Score?",
    a: "A Trust Score is a documented metric derived from structured coworker confirmations and verification data. It gives employers a consistent way to assess verification strength without replacing human judgment.",
  },
  {
    q: "How does peer verification work?",
    a: "Workers add past employers and invite coworkers to confirm employment. Coworkers respond to structured verification requests. Results are compiled into verification reports and trust metrics that employers can review.",
  },
  {
    q: "Is WorkVouch free for workers?",
    a: "Yes. Workers can create profiles, add employment history, and request coworker verification at no cost. Paid plans apply to employers who search profiles and run verification reports.",
  },
  {
    q: "What happens if limits are exceeded?",
    a: "Plan limits apply to searches and reports per billing cycle. If you exceed limits, overage options or plan upgrades are available. Contact support or check your plan settings for details.",
  },
  {
    q: "Can plans be upgraded mid-cycle?",
    a: "Yes. You can upgrade to a higher plan at any time. Billing is prorated where applicable. Downgrades typically take effect at the next billing cycle.",
  },
];

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (priceId: string | undefined) => {
    if (!priceId || !priceId.startsWith("price_")) {
      alert("Checkout is not configured for this plan. Please contact support.");
      return;
    }
    setLoadingPlan(priceId);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout failed: " + (data?.error ?? "Unknown error"));
        setLoadingPlan(null);
      }
    } catch (err: unknown) {
      console.error(err);
      alert("Checkout failed. Please try again.");
      setLoadingPlan(null);
    }
  };

  const interval = billingInterval ?? "monthly";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-20">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Transparent Pricing Built Around Hiring Volume.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Choose the plan that aligns with your organization&apos;s verification needs.
        </p>

        {/* Billing toggle */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setBillingInterval("monthly")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:px-5 sm:py-2.5 ${
              interval === "monthly"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval("yearly")}
            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:px-5 sm:py-2.5 ${
              interval === "yearly"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            Annual
            <span className="ml-1.5 rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Save 2 months
            </span>
          </button>
        </div>
      </section>

      {/* Plan cards */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-20">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plans?.map((plan) => {
            const planId = plan?.id ?? "";
            const name = plan?.name ?? "Plan";
            const positioning = plan?.positioning ?? "";
            const lookups = plan?.lookups ?? "";
            const features = Array.isArray(plan?.features) ? plan.features : [];
            const currentPrice = plan?.prices?.[interval];

            const amount = currentPrice?.amount ?? 0;
            const priceId = currentPrice?.stripePriceId;
            const isYearly = interval === "yearly";

            return (
              <Card key={planId} hover className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-900 dark:text-white">
                    {name}
                  </CardTitle>
                  <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                    ${amount}
                    {isYearly ? "/year" : "/month"}
                  </p>
                  {positioning ? (
                    <p className="text-sm font-normal text-slate-600 dark:text-slate-400">
                      {positioning}
                    </p>
                  ) : null}
                  {lookups ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {lookups}
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-4">
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    {features.map((item, idx) => (
                      <li key={idx}>{item ?? ""}</li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-4">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={() => handleCheckout(priceId)}
                      disabled={
                        loadingPlan !== null ||
                        !priceId ||
                        !String(priceId).startsWith("price_")
                      }
                    >
                      {loadingPlan === priceId
                        ? "Redirecting..."
                        : "Get Started"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-10 space-y-8">
            {faqs?.map((faq, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {faq?.q ?? ""}
                </h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  {faq?.a ?? ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Build Hiring Decisions on Documented Experience.
        </h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button href="/signup" variant="primary" size="lg">
            Get Started Free
          </Button>
          <Button href="/contact" variant="secondary" size="lg">
            Contact Sales
          </Button>
        </div>
      </section>
    </div>
  );
}
