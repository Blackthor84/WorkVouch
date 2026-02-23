"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon } from "@heroicons/react/24/solid";
import { EMPLOYER_PLANS } from "@/lib/pricing/employer-plans";
import { PRICING_HEADLINE, PRICING_SUBHEADLINE } from "@/data/pricing-copy";

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
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel your subscription at any time from your billing settings. There are no long-term commitments or cancellation fees.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. We use industry-standard encryption, secure infrastructure, and strict access controls. We do not sell your data and only use it to deliver the verification and hiring tools you signed up for.",
  },
  {
    q: "Do I need a long-term contract?",
    a: "No. All plans are month-to-month or annual (with a discount). You can upgrade, downgrade, or cancel at any time.",
  },
  {
    q: "What happens after trial?",
    a: "Start with a free account and add your first jobs. When you're ready to search verified candidates or run reports, choose a plan. You only pay for the plan you select; there's no surprise charge at the end of a trial.",
  },
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

  const interval = billingInterval ?? "monthly";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-4xl lg:text-5xl">
          {PRICING_HEADLINE}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-[#334155] md:text-lg">
          {PRICING_SUBHEADLINE}
        </p>

        {/* Billing toggle */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setBillingInterval("monthly")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:px-5 sm:py-2.5 ${
              interval === "monthly"
                ? "bg-[#2563EB] text-white"
                : "bg-white border border-[#E2E8F0] text-[#334155] hover:bg-slate-50"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval("yearly")}
            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:px-5 sm:py-2.5 ${
              interval === "yearly"
                ? "bg-[#2563EB] text-white"
                : "bg-white border border-[#E2E8F0] text-[#334155] hover:bg-slate-50"
            }`}
          >
            Annual
            <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
              Save 2 months annually
            </span>
          </button>
        </div>
      </section>

      {/* Plan cards — middle tier highlighted, outcome bullets, Who Is For, hover, CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:pb-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 sm:gap-8 items-stretch">
          {EMPLOYER_PLANS.map((plan) => {
            const isPro = plan.id === "pro";
            const isCustom = plan.id === "custom";
            const amount = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
            const isYearly = interval === "yearly";
            const signupHref = `/signup?plan_tier=${plan.id}&interval=${interval}`;
            const cardHref = isCustom ? (plan.ctaHref ?? "/contact") : signupHref;

            return (
              <Link
                key={plan.id}
                href={cardHref}
                className={`block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 rounded-2xl ${isPro ? "lg:-my-2" : ""}`}
              >
                <Card
                  className={`relative flex flex-col h-full border cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-[#2563EB] hover:scale-105 ${
                    isPro
                      ? "border-[#2563EB] shadow-xl scale-[1.02] lg:scale-[1.05] bg-white ring-2 ring-[#2563EB]"
                      : "border-[#E2E8F0] bg-white"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-[#2563EB] px-3 py-1 text-xs font-semibold text-white">
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  <CardHeader className={plan.badge ? "pt-6" : ""}>
                    <CardTitle className="text-xl text-[#0F172A]">
                      {plan.name}
                    </CardTitle>
                    <p className="text-sm font-medium text-[#334155]">
                      {plan.description}
                    </p>
                    {!isCustom && (
                      <p className="text-2xl font-bold text-[#0F172A]">
                        ${amount}
                        <span className="text-base font-normal text-[#64748B]">
                          {isYearly ? "/year" : "/month"}
                        </span>
                      </p>
                    )}
                    {isYearly && !isCustom && (
                      <p className="text-xs text-[#64748B]">
                        Save 2 months annually
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col space-y-4">
                    {plan.whoIsFor && (
                      <div className="rounded-lg bg-slate-50 border border-[#E2E8F0] px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] mb-0.5">
                          Who this plan is for
                        </p>
                        <p className="text-sm font-medium text-[#0F172A]">
                          {plan.whoIsFor}
                        </p>
                      </div>
                    )}
                    <ul className="list-none space-y-2 text-sm text-[#334155]">
                      {plan.features.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckIcon className="h-4 w-4 shrink-0 text-[#2563EB] mt-0.5" aria-hidden />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-6">
                      <span
                        className={`flex items-center justify-center w-full rounded-xl px-6 py-4 text-base font-semibold transition-all duration-200 ${
                          isCustom
                            ? "bg-white text-[#334155] border-2 border-[#E2E8F0] hover:bg-slate-50 hover:border-[#2563EB]"
                            : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                        }`}
                      >
                        {isCustom ? "Contact Sales" : "Start Free Trial"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ROI comparison — remove objection / anchor value */}
      <section className="mx-auto max-w-4xl px-4 pb-12 sm:px-6">
        <div className="rounded-2xl border-2 border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-sm">
          <p className="text-center text-lg font-semibold text-[#0F172A]">
            One bad hire costs $8,000–$15,000.
          </p>
          <p className="text-center mt-1 text-[#334155]">
            WorkVouch helps you avoid that for <strong className="text-[#0F172A]">${EMPLOYER_PLANS[0].priceMonthly}/month</strong>.
          </p>
        </div>
      </section>

      {/* Feature comparison */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16 overflow-x-hidden">
        <h2 className="sr-only">Feature comparison</h2>
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="px-4 py-3 font-semibold text-[#0F172A]">
                  Feature
                </th>
                <th className="px-4 py-3 font-semibold text-[#0F172A] text-center">
                  Starter
                </th>
                <th className="bg-blue-50 px-4 py-3 font-semibold text-[#0F172A] text-center ring-inset ring-1 ring-[#E2E8F0]">
                  Pro
                </th>
                <th className="px-4 py-3 font-semibold text-[#0F172A] text-center">
                  Custom
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-[#E2E8F0] last:border-0"
                >
                  <td className="px-4 py-3 text-[#334155]">
                    {row.feature}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.starter ? (
                      <CheckIcon className="mx-auto h-5 w-5 text-[#2563EB]" aria-hidden />
                    ) : (
                      <span className="text-[#64748B]">—</span>
                    )}
                  </td>
                  <td className="bg-blue-50 px-4 py-3 text-center ring-inset ring-1 ring-[#E2E8F0]">
                    {row.pro ? (
                      <CheckIcon className="mx-auto h-5 w-5 text-[#2563EB]" aria-hidden />
                    ) : (
                      <span className="text-[#64748B]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.custom ? (
                      <CheckIcon className="mx-auto h-5 w-5 text-[#2563EB]" aria-hidden />
                    ) : (
                      <span className="text-[#64748B]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-[#E2E8F0] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <p className="text-center text-sm leading-relaxed text-[#334155]">
            WorkVouch provides verified employment and peer confirmation data.
            We do not provide background checks or criminal history reports.
          </p>
        </div>
      </section>

      {/* Final CTA — account creation first, then plan selection */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-20">
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
          Get started with verified work history
        </h2>
        <p className="mt-4 text-base text-[#334155]">
          Create your account first. Choose a plan after signup.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
          <Button href="/signup" variant="primary" size="lg" className="w-full sm:w-auto">
            Get Started
          </Button>
          <Button href="/pricing" variant="secondary" size="lg" className="w-full sm:w-auto">
            View plans
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-[#0F172A] sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-10 space-y-8">
            {faqs.map((faq, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-semibold text-[#0F172A]">
                  {faq.q}
                </h3>
                <p className="mt-2 text-[#334155]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
