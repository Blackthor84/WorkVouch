"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import Footer from "@/components/Footer";
import { WvShell, WvContainer, WvCard, WvButton, WvBadge } from "@/components/wv";
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
    <WvShell>
      <main>
        {/* Hero */}
        <WvContainer className="py-16 text-center lg:py-20">
          <h1 className="text-3xl font-bold tracking-tight text-wv-foreground md:text-4xl lg:text-5xl">
            {PRICING_HEADLINE}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-wv-muted md:text-lg">
            {PRICING_SUBHEADLINE}
          </p>

          <div className="mt-8 inline-flex items-center rounded-xl border border-wv-border bg-wv-surface p-1">
            <button
              type="button"
              onClick={() => setBillingInterval("monthly")}
              className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
                interval === "monthly"
                  ? "bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg"
                  : "text-wv-muted hover:text-wv-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("yearly")}
              className={`relative rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
                interval === "yearly"
                  ? "bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg"
                  : "text-wv-muted hover:text-wv-foreground"
              }`}
            >
              Annual
              <WvBadge variant="success" className="ml-2">
                Save 2 months
              </WvBadge>
            </button>
          </div>
        </WvContainer>

        {/* Plan cards */}
        <WvContainer className="pb-12 lg:pb-16">
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
                  className={`block focus:outline-none focus-visible:ring-2 focus-visible:ring-wv-brand-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-wv-bg rounded-2xl ${isPro ? "lg:-my-2" : ""}`}
                >
                  <WvCard
                    hover
                    glow={isPro}
                    className={`relative flex flex-col h-full cursor-pointer ${
                      isPro ? "border-blue-500/40 ring-1 ring-blue-500/30 lg:scale-[1.02]" : ""
                    }`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <WvBadge variant="brand">{plan.badge}</WvBadge>
                      </div>
                    )}
                    <div className={plan.badge ? "pt-2" : ""}>
                      <h2 className="text-xl font-bold text-wv-foreground">{plan.name}</h2>
                      <p className="text-sm font-medium text-wv-muted mt-1">{plan.description}</p>
                      {!isCustom && (
                        <p className="text-2xl font-bold text-wv-foreground mt-4">
                          ${amount}
                          <span className="text-base font-normal text-wv-subtle">
                            {isYearly ? "/year" : "/month"}
                          </span>
                        </p>
                      )}
                      {isYearly && !isCustom && (
                        <p className="text-xs text-wv-subtle mt-1">Save 2 months annually</p>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col space-y-4 mt-6">
                      {plan.whoIsFor && (
                        <div className="rounded-lg bg-wv-bg/50 border border-wv-border px-3 py-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-wv-subtle mb-0.5">
                            Who this plan is for
                          </p>
                          <p className="text-sm font-medium text-wv-foreground">{plan.whoIsFor}</p>
                        </div>
                      )}
                      <ul className="list-none space-y-2 text-sm text-wv-muted">
                        {plan.features.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" aria-hidden />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto pt-6">
                        <span
                          className={`flex items-center justify-center w-full rounded-xl px-6 py-4 text-base font-semibold transition-all duration-200 ${
                            isCustom
                              ? "bg-wv-surface text-wv-foreground border border-wv-border hover:border-wv-border-hover"
                              : "bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/25"
                          }`}
                        >
                          {isCustom ? "Contact Sales" : "Start Free Trial"}
                        </span>
                      </div>
                    </div>
                  </WvCard>
                </Link>
              );
            })}
          </div>
        </WvContainer>

        {/* ROI comparison */}
        <WvContainer className="pb-12">
          <WvCard glow className="max-w-4xl mx-auto text-center">
            <p className="text-lg font-semibold text-wv-foreground">
              One bad hire costs $8,000–$15,000.
            </p>
            <p className="mt-1 text-wv-muted">
              WorkVouch helps you avoid that for{" "}
              <strong className="text-wv-foreground">${EMPLOYER_PLANS[0].priceMonthly}/month</strong>.
            </p>
          </WvCard>
        </WvContainer>

        {/* Feature comparison */}
        <WvContainer className="py-12 lg:py-16 overflow-x-hidden">
          <h2 className="sr-only">Feature comparison</h2>
          <div className="overflow-x-auto rounded-xl border border-wv-border bg-wv-surface">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-wv-border">
                  <th className="px-4 py-3 font-semibold text-wv-foreground">Feature</th>
                  <th className="px-4 py-3 font-semibold text-wv-foreground text-center">Starter</th>
                  <th className="bg-blue-500/10 px-4 py-3 font-semibold text-wv-foreground text-center ring-inset ring-1 ring-wv-border">
                    Pro
                  </th>
                  <th className="px-4 py-3 font-semibold text-wv-foreground text-center">Custom</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-wv-border last:border-0">
                    <td className="px-4 py-3 text-wv-muted">{row.feature}</td>
                    <td className="px-4 py-3 text-center">
                      {row.starter ? (
                        <Check className="mx-auto h-5 w-5 text-blue-400" aria-hidden />
                      ) : (
                        <span className="text-wv-subtle">—</span>
                      )}
                    </td>
                    <td className="bg-blue-500/10 px-4 py-3 text-center ring-inset ring-1 ring-wv-border">
                      {row.pro ? (
                        <Check className="mx-auto h-5 w-5 text-blue-400" aria-hidden />
                      ) : (
                        <span className="text-wv-subtle">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.custom ? (
                        <Check className="mx-auto h-5 w-5 text-blue-400" aria-hidden />
                      ) : (
                        <span className="text-wv-subtle">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WvContainer>

        {/* Trust strip */}
        <section className="border-y border-wv-border bg-wv-surface/50">
          <WvContainer className="py-6 sm:py-8">
            <p className="text-center text-sm leading-relaxed text-wv-muted">
              WorkVouch provides verified employment and peer confirmation data.
              We do not provide background checks or criminal history reports.
            </p>
          </WvContainer>
        </section>

        {/* Final CTA */}
        <WvContainer className="py-16 text-center lg:py-20">
          <h2 className="text-2xl font-bold tracking-tight text-wv-foreground sm:text-3xl">
            Get started with verified work history
          </h2>
          <p className="mt-4 text-base text-wv-muted">
            Create your account first. Choose a plan after signup.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
            <WvButton href="/signup" size="lg" className="w-full sm:w-auto">
              Get Started
            </WvButton>
            <WvButton href="/pricing" variant="secondary" size="lg" className="w-full sm:w-auto">
              View plans
            </WvButton>
          </div>
        </WvContainer>

        {/* FAQ */}
        <section className="border-t border-wv-border">
          <WvContainer className="py-16 lg:py-20" size="narrow">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-wv-foreground sm:text-3xl">
              Frequently asked questions
            </h2>
            <div className="mt-10 space-y-6">
              {faqs.map((faq, idx) => (
                <WvCard key={idx} padding="md" className="text-left">
                  <h3 className="text-lg font-semibold text-wv-foreground">{faq.q}</h3>
                  <p className="mt-2 text-wv-muted text-sm leading-relaxed">{faq.a}</p>
                </WvCard>
              ))}
            </div>
          </WvContainer>
        </section>
      </main>
      <Footer />
    </WvShell>
  );
}
