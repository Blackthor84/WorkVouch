"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon } from "@heroicons/react/24/solid";
import { EMPLOYER_PLANS } from "@/lib/pricing/employer-plans";

const comparisonRows: { feature: string; starter: boolean; pro: boolean; custom: boolean }[] = [
  { feature: "Verified work history visibility", starter: true, pro: true, custom: true },
  { feature: "Contact confirmed coworkers", starter: true, pro: true, custom: true },
  { feature: "Worker searches per month", starter: true, pro: true, custom: true },
  { feature: "Verification reports per month", starter: true, pro: true, custom: true },
  { feature: "Team visibility tools", starter: false, pro: true, custom: true },
  { feature: "Role-based access controls", starter: false, pro: true, custom: true },
  { feature: "Unlimited searches & reports", starter: false, pro: false, custom: true },
  { feature: "Multi-location account management", starter: false, pro: false, custom: true },
  { feature: "Dedicated support contact", starter: false, pro: false, custom: true },
];

const faqs: { q: string; a: string }[] = [
  {
    q: "What is verified work history?",
    a: "Workers add past employers and invite coworkers to confirm employment. Coworkers respond to verification requests. Results are compiled into verification reports that employers can review.",
  },
  {
    q: "Is WorkVouch free for workers?",
    a: "Yes. Workers can create profiles, add employment history, and request coworker verification at no cost. Paid plans apply to employers who search profiles and run verification reports.",
  },
  {
    q: "What happens if I exceed my limits?",
    a: "Plan limits apply to searches and reports per billing cycle. You can upgrade your plan at any time. Contact us if you need higher limits.",
  },
  {
    q: "Can I switch between monthly and annual?",
    a: "Yes. Annual billing saves 2 months (10 months price for 12 months). You can change at renewal in your billing settings.",
  },
];

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (priceId: string | undefined) => {
    if (!priceId || !priceId.startsWith("price_")) {
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
        alert("Checkout failed. Please try again or contact support.");
        setLoadingPlan(null);
      }
    } catch {
      alert("Checkout failed. Please try again.");
      setLoadingPlan(null);
    }
  };

  const interval = billingInterval ?? "monthly";

  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1117]">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
          Verification + trusted work history
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          Choose the plan that fits your hiring team. Simple, transparent pricing.
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
              Save 2 months annually
            </span>
          </button>
        </div>
      </section>

      {/* Plan cards — 3 columns, Pro emphasized */}
      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:pb-16">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          {EMPLOYER_PLANS.map((plan) => {
            const isPro = plan.id === "pro";
            const isCustom = plan.id === "custom";
            const priceId =
              interval === "yearly"
                ? plan.stripePriceIdYearly
                : plan.stripePriceIdMonthly;
            const amount = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
            const isYearly = interval === "yearly";

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col border-slate-200 dark:border-slate-700 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-0.5 ${
                  isPro
                    ? "ring-2 ring-blue-500/50 shadow-xl scale-[1.02] lg:scale-[1.03] bg-slate-50/50 dark:bg-slate-800/30"
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
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {plan.description}
                  </p>
                  {!isCustom && (
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      ${amount}
                      <span className="text-base font-normal text-slate-600 dark:text-slate-300">
                        {isYearly ? "/year" : "/month"}
                      </span>
                    </p>
                  )}
                  {isYearly && !isCustom && (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Save 2 months annually
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

      {/* Feature comparison */}
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
                  Starter
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
                    {row.starter ? (
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
                    {row.custom ? (
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

      {/* Trust strip */}
      <section className="border-y border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <p className="text-center text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            WorkVouch provides verified employment and peer confirmation data.
            We do not provide background checks or criminal history reports.
          </p>
        </div>
      </section>

      {/* Final CTA — account creation first, then plan selection */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-20">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Get started with verified work history
        </h2>
        <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
          Create your account first. Choose a plan after signup.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button href="/signup" variant="primary" size="lg">
            Get Started
          </Button>
          <Button href="/pricing" variant="secondary" size="lg">
            View plans
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Frequently asked questions
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
