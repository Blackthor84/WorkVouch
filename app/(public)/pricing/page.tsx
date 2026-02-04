"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon } from "@heroicons/react/24/solid";
import { EMPLOYER_PLANS } from "@/lib/pricing/employer-plans";

// Single source of truth: Lite, Pro, Enterprise. Map to pricing page card shape.
const plans = EMPLOYER_PLANS.map((p) => ({
  id: p.id,
  name: p.name,
  subtitle: p.description,
  badge: p.id === "pro" ? "Most Popular" : undefined,
  prices: p.stripePriceId
    ? {
        monthly: { amount: p.priceMonthly, stripePriceId: p.stripePriceId },
        yearly: { amount: Math.round(p.priceMonthly * 10), stripePriceId: p.stripePriceId },
      }
    : null,
  displayPrice: p.priceMonthly,
  features: p.features,
  footnote: p.description,
  cta: p.id === "enterprise" && !p.stripePriceId ? "Contact Sales" : "Get Started",
  ctaHref: p.id === "enterprise" && !p.stripePriceId ? "/contact" : undefined,
  isCustom: p.id === "enterprise" && !p.stripePriceId,
}));

const comparisonRows: { feature: string; lite: boolean; pro: boolean; enterprise: boolean }[] = [
  { feature: "Overall Reputation Score", lite: true, pro: true, enterprise: true },
  { feature: "Verified Employment Count", lite: true, pro: true, enterprise: true },
  { feature: "Basic Profile Access", lite: true, pro: true, enterprise: true },
  { feature: "Full Employment Overlap Visibility", lite: false, pro: true, enterprise: true },
  { feature: "Peer Reference Summaries", lite: false, pro: true, enterprise: true },
  { feature: "Rehire Eligibility Indicators", lite: false, pro: true, enterprise: true },
  { feature: "Unlimited Candidate Lookups", lite: false, pro: true, enterprise: true },
  { feature: "Employer Dashboard Insights", lite: false, pro: true, enterprise: true },
  { feature: "Multi-location & API", lite: false, pro: false, enterprise: true },
];

const faqs: { q: string; a: string }[] = [
  {
    q: "What is a Reputation Score?",
    a: "A Reputation Score is a documented metric derived from structured coworker confirmations and verification data. It gives employers a consistent way to assess verification strength without replacing human judgment.",
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
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
          Simple Access to Verified Employment Reputation
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Choose the level of transparency and workforce insight your organization needs.
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

      {/* Plan cards — 3 columns, Pro emphasized */}
      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:pb-16">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const isPro = plan.id === "pro";
            const isCustom = plan.isCustom;
            const currentPrice = !isCustom && plan.prices ? plan.prices[interval] : null;
            const amount = currentPrice?.amount ?? null;
            const priceId = currentPrice?.stripePriceId;
            const isYearly = interval === "yearly";

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col border-slate-200 dark:border-slate-700 ${
                  isPro
                    ? "ring-2 ring-blue-500/50 shadow-lg scale-[1.02] lg:scale-[1.03]"
                    : ""
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white dark:bg-blue-500">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <CardHeader className={plan.badge ? "pt-6" : ""}>
                  <CardTitle className="text-xl text-slate-900 dark:text-white">
                    {plan.name}
                  </CardTitle>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {plan.subtitle}
                  </p>
                  {!isCustom && amount !== null && (
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      ${amount}
                      <span className="text-base font-normal text-slate-600 dark:text-slate-400">
                        {isYearly ? "/year" : "/month"}
                      </span>
                    </p>
                  )}
                  {isCustom && (
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      ${plan.displayPrice ?? 199}
                      <span className="text-base font-normal text-slate-600 dark:text-slate-400">
                        /month
                      </span>
                    </p>
                  )}
                  {plan.footnote && (
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {plan.footnote}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-4">
                  <ul className="list-none space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    {plan.features.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckIcon className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    {isCustom ? (
                      <Button
                        href={plan.ctaHref ?? "/contact"}
                        variant="secondary"
                        size="lg"
                        className="w-full"
                      >
                        {plan.cta}
                      </Button>
                    ) : (
                      <Button
                        variant={isPro ? "primary" : "secondary"}
                        size="lg"
                        className="w-full"
                        onClick={() => handleCheckout(priceId)}
                        disabled={
                          loadingPlan !== null ||
                          !priceId ||
                          !String(priceId).startsWith("price_")
                        }
                      >
                        {loadingPlan === priceId ? "Redirecting..." : plan.cta}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Feature comparison grid — Pro column emphasized */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <h2 className="sr-only">Feature comparison</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                  Feature
                </th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-center">
                  Lite
                </th>
                <th className="bg-blue-50/80 dark:bg-blue-900/20 px-4 py-3 font-semibold text-slate-900 dark:text-white text-center ring-inset ring-1 ring-blue-200/60 dark:ring-blue-700/40">
                  Pro
                </th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-center">
                  Custom
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-100 dark:border-slate-700/80 last:border-0"
                >
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {row.feature}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.lite ? (
                      <CheckIcon className="mx-auto h-5 w-5 text-blue-500" aria-hidden />
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="bg-blue-50/50 dark:bg-blue-900/10 px-4 py-3 text-center ring-inset ring-1 ring-blue-200/40 dark:ring-blue-700/30">
                    {row.pro ? (
                      <CheckIcon className="mx-auto h-5 w-5 text-blue-500" aria-hidden />
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.enterprise ? (
                      <CheckIcon className="mx-auto h-5 w-5 text-blue-500" aria-hidden />
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Compliance strip */}
      <section className="border-y border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <p className="text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            WorkVouch provides verified employment overlap and peer validation
            data. We do not provide background checks or criminal history
            reports.
          </p>
        </div>
      </section>

      {/* Fairness & Transparency */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Transparent & Structured
        </h2>
        <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-slate-700 dark:text-slate-300">
          <li className="flex items-center gap-2">
            <CheckIcon className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
            Built-in dispute system
          </li>
          <li className="flex items-center gap-2">
            <CheckIcon className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
            Appeal process
          </li>
          <li className="flex items-center gap-2">
            <CheckIcon className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
            Audit logging
          </li>
          <li className="flex items-center gap-2">
            <CheckIcon className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
            Role-based access control
          </li>
          <li className="flex items-center gap-2">
            <CheckIcon className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
            Secure data handling
          </li>
        </ul>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          All verification data can be reviewed and disputed. Trust scores are
          recalculated when corrections are made.
        </p>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-20">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Bring Verified Employment Transparency Into Your Hiring Process
        </h2>
        <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
          Secure billing. Cancel anytime.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              const litePlan = plans.find((p) => p.id === "lite");
              if (litePlan && !litePlan.isCustom && litePlan.prices) {
                const priceId = litePlan.prices[interval]?.stripePriceId;
                handleCheckout(priceId);
              }
            }}
            disabled={loadingPlan !== null}
          >
            {loadingPlan ? "Redirecting..." : "Start With Lite"}
          </Button>
          <Button href="/signup?type=employer" variant="primary" size="lg">
            Upgrade to Pro
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-10 space-y-8">
            {faqs.map((faq, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {faq.q}
                </h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
