"use client";

import { useState } from "react";
import { employerPlans, payPerUse } from "@/data/pricing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PlanId = "starter" | "team" | "pro" | "security" | "one_time";

interface PlanDisplay {
  positioning: string;
  includes: string[];
  bestFor: string;
  ctaLabel: string;
}

const planDisplay: Record<PlanId, PlanDisplay> = {
  starter: {
    positioning: "Designed for small businesses beginning structured verification.",
    includes: [
      "15 worker searches per month",
      "10 verification reports per month",
      "Basic trust scoring",
      "Exportable PDF reports",
      "Standard support",
    ],
    bestFor: "Local businesses and small teams.",
    ctaLabel: "Start Starter Plan",
  },
  team: {
    positioning: "Built for growing hiring teams managing multiple roles.",
    includes: [
      "50 worker searches per month",
      "40 verification reports per month",
      "Unlimited coworker messaging",
      "Advanced trust analytics",
      "Hiring dashboard",
      "Priority support",
    ],
    bestFor: "HR departments and recruiting teams.",
    ctaLabel: "Upgrade to Team",
  },
  pro: {
    positioning: "Structured for high-volume hiring environments.",
    includes: [
      "150 worker searches per month",
      "120 verification reports per month",
      "Department subaccounts",
      "Role-based permissions",
      "Applicant comparison tools",
      "Bulk import & auto-verification",
    ],
    bestFor: "Established companies scaling hiring operations.",
    ctaLabel: "Go Pro",
  },
  security: {
    positioning: "Purpose-built for credential-driven agencies.",
    includes: [
      "80 verification reports per month",
      "Unlimited worker searches",
      "Guard license uploads",
      "Auto-flagging inconsistencies",
      "Shift preference tracking",
      "Proof-of-work documentation",
    ],
    bestFor: "Security and compliance-heavy employers.",
    ctaLabel: "Get Security Bundle",
  },
  one_time: {
    positioning: "For occasional verification needs.",
    includes: [
      "Single verification report",
      "Peer confirmation summary",
      "Trust score breakdown",
      "PDF export",
    ],
    bestFor: "",
    ctaLabel: "Buy Report",
  },
};

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

type PlanEntry = (typeof employerPlans)[number] | typeof payPerUse;

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (plan: PlanEntry) => {
    setLoadingPlan(plan.id);
    try {
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
    } catch (err: unknown) {
      console.error(err);
      alert("Checkout failed. Please try again.");
      setLoadingPlan(null);
    }
  };

  const monthlyPlans = employerPlans as PlanEntry[];
  const allPlans: PlanEntry[] = [...monthlyPlans, payPerUse];

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
      </section>

      {/* Plan cards */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-20">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {allPlans.map((plan) => {
            const display = planDisplay[plan.id as PlanId];
            const isPayPerUse = plan.id === "one_time";
            const priceLabel = isPayPerUse
              ? `$${plan.price} / report`
              : `$${plan.price} / month`;

            return (
              <Card key={plan.id} hover className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-900 dark:text-white">
                    {plan.name}
                  </CardTitle>
                  <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                    {priceLabel}
                  </p>
                  <p className="text-sm font-normal text-slate-600 dark:text-slate-400">
                    {display.positioning}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Includes
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
                      {display.includes.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  {display.bestFor && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Best for:
                      </span>{" "}
                      {display.bestFor}
                    </p>
                  )}
                  <div className="mt-auto pt-4">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={() => handleCheckout(plan)}
                      disabled={loadingPlan === plan.id}
                    >
                      {loadingPlan === plan.id ? "Redirecting..." : display.ctaLabel}
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
