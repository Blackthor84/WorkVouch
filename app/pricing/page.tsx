"use client";

import { useState } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface PricingTier {
  id: string;
  name: string;
  price: string;
  priceNote?: string;
  description: string;
  color: "blue" | "orange" | "green" | "gray";
  recommended?: boolean;
  features: string[];
  cta: string;
  stripePriceId?: string;
}

const employeeTiers: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    priceNote: "/month",
    description: "Perfect for getting started with verified work history",
    color: "blue",
    features: [
      "Add unlimited past job history",
      "Match with former coworkers",
      "Receive up to 3 peer references",
      'Basic "Peer Verified %" trust score',
      "Discoverable by employers",
    ],
    cta: "Get Started Free",
  },
  {
    id: "pro-worker",
    name: "Pro Worker",
    price: "$4.99",
    priceNote: "/month",
    description: "Unlock your full professional potential",
    color: "blue",
    recommended: true,
    features: [
      "Everything in Free",
      "Unlimited coworker matches",
      "Unlimited peer references",
      '"Verified Worker" badge',
      "Priority ranking in employer search results",
      'Downloadable "WorkVouch Resume" PDF',
      "Full trust score analytics",
      "Faster coworker request response",
    ],
    cta: "Subscribe Now",
    stripePriceId: "price_pro_worker",
  },
  {
    id: "trust-boost",
    name: "One-Time Trust Boost",
    price: "$9.99",
    priceNote: "one-time",
    description: "Instant credibility boost for your profile",
    color: "blue",
    features: [
      "Instant trust badge",
      "Full WorkVouch report visible to employers",
      "Trust Boost score increase",
    ],
    cta: "Boost My Trust",
    stripePriceId: "price_trust_boost",
  },
];

const employerTiers: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$49",
    priceNote: "/month",
    description: "Perfect for small businesses and startups",
    color: "orange",
    features: [
      "15 worker profile searches/month",
      "10 WorkVouch verification reports",
      "Contact verified coworkers",
      "Basic trust scores",
      "Export verification PDF",
    ],
    cta: "Start Hiring",
    stripePriceId: "price_starter",
  },
  {
    id: "team",
    name: "Team",
    price: "$149",
    priceNote: "/month",
    description: "Ideal for growing teams and HR departments",
    color: "orange",
    recommended: true,
    features: [
      "50 searches/month",
      "40 verification reports",
      "Unlimited coworker messaging",
      "Advanced trust analytics",
      "New hire tracking dashboard",
      "Priority chat support",
    ],
    cta: "Upgrade to Team",
    stripePriceId: "price_team",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$299",
    priceNote: "/month",
    description: "For established companies with high hiring volume",
    color: "orange",
    features: [
      "150 searches/month",
      "120 verification reports",
      "Department subaccounts",
      "Bulk worker import & auto-verification",
      "Role-based permissions",
      "Applicant comparison tools",
    ],
    cta: "Go Pro",
    stripePriceId: "price_pro",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$499",
    priceNote: "/month",
    description: "Complete solution for large organizations",
    color: "orange",
    features: [
      "Unlimited searches",
      "Unlimited verification reports",
      "Full API access",
      "Custom integration support",
      "Dedicated account manager",
      "Onboarding & live training sessions",
    ],
    cta: "Contact Sales",
    stripePriceId: "price_enterprise",
  },
  {
    id: "pay-per-use",
    name: "Pay-Per-Use",
    price: "$14.99",
    priceNote: "/report",
    description: "Pay only for what you need, when you need it",
    color: "gray",
    features: [
      "Confirmed job history",
      "Peer verification summary",
      "Trust score breakdown",
      "Peer reliability insights",
      "Exportable PDF",
      "Contact peers",
    ],
    cta: "Buy Report",
    stripePriceId: "price_pay_per_use",
  },
  {
    id: "security-bundle",
    name: "Security Agency Bundle",
    price: "$199",
    priceNote: "/month",
    description: "Specialized package for security agencies",
    color: "green",
    recommended: true,
    features: [
      "80 verification reports/month",
      "Unlimited worker searches",
      "Unlimited coworker messaging",
      "Proof-of-work history for guards",
      "Upload guard licenses, certificates & training",
      "Auto-flag inconsistent claims",
      "Guard availability & shift preference tools",
    ],
    cta: "Get Security Bundle",
    stripePriceId: "price_security_bundle",
  },
];

const faqItems = [
  {
    question: "What is a Trust Score?",
    answer:
      "Your Trust Score is a 0-100 rating that reflects how verified and trustworthy your work history is. It's calculated based on peer verifications, number of verified jobs, and reference quality. Higher scores make you more discoverable and credible to employers.",
  },
  {
    question: "How does Peer Verification work?",
    answer:
      "When you add a job to your profile, WorkVouch matches you with coworkers who worked at the same company during the same time period. These verified coworkers can confirm your employment and write references. This creates a trusted, verified work history that employers can rely on.",
  },
  {
    question: "What's the difference between Free and Pro Worker?",
    answer:
      "Free gives you 3 peer references and basic trust scoring. Pro Worker unlocks unlimited references, priority in search results, a verified badge, downloadable resume PDFs, and full analytics. Pro Worker is perfect for serious job seekers who want maximum visibility.",
  },
  {
    question: "Can I switch plans later?",
    answer:
      "Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect immediately, and we'll prorate any charges. Your verified work history and references remain intact regardless of your plan.",
  },
  {
    question: "What happens if I exceed my monthly limits?",
    answer:
      "For employer plans, if you exceed your monthly search or report limits, you can either upgrade to a higher tier or purchase additional reports at the Pay-Per-Use rate ($14.99/report). We'll notify you when you're approaching your limits.",
  },
  {
    question: "Is the Security Agency Bundle different from other employer plans?",
    answer:
      "Yes! The Security Agency Bundle is specifically designed for security companies. It includes specialized features like guard license verification, certificate tracking, shift preference tools, and auto-flagging of inconsistent claims. It's optimized for the unique needs of security agencies.",
  },
];

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<"employee" | "employer">("employee");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubscribe = (tier: PricingTier) => {
    // Stripe integration placeholder
    if (tier.stripePriceId) {
      // TODO: Integrate with Stripe Checkout
      console.log(`Redirecting to Stripe for ${tier.name} - ${tier.stripePriceId}`);
      // window.location.href = `/api/stripe/checkout?priceId=${tier.stripePriceId}`;
    } else {
      // Free tier - redirect to signup
      window.location.href = "/auth/signup";
    }
  };

  const getColorClasses = (color: PricingTier["color"], isRecommended?: boolean) => {
    const colors = {
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-500",
        text: "text-blue-700",
        button: "bg-blue-600 hover:bg-blue-700",
        badge: "bg-blue-600",
      },
      orange: {
        bg: "bg-orange-50",
        border: "border-orange-500",
        text: "text-orange-700",
        button: "bg-orange-600 hover:bg-orange-700",
        badge: "bg-orange-600",
      },
      green: {
        bg: "bg-green-50",
        border: "border-green-500",
        text: "text-green-700",
        button: "bg-green-600 hover:bg-green-700",
        badge: "bg-green-600",
      },
      gray: {
        bg: "bg-gray-50",
        border: "border-gray-500",
        text: "text-gray-700",
        button: "bg-gray-600 hover:bg-gray-700",
        badge: "bg-gray-600",
      },
    };

    const base = colors[color];
    return {
      ...base,
      card: isRecommended
        ? `${base.bg} ${base.border} border-4 shadow-xl scale-105`
        : `${base.bg} ${base.border} border-2 shadow-lg`,
    };
  };

  const currentTiers = activeTab === "employee" ? employeeTiers : employerTiers;

  return (
    <div className="bg-gray-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            WorkVouch Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Build credibility. Hire with confidence. Choose the plan that fits your needs.
          </p>

          {/* Tab Switcher */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1 shadow-sm">
              <button
                onClick={() => setActiveTab("employee")}
                className={`px-6 py-3 rounded-md font-semibold transition-all ${
                  activeTab === "employee"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                For Workers
              </button>
              <button
                onClick={() => setActiveTab("employer")}
                className={`px-6 py-3 rounded-md font-semibold transition-all ${
                  activeTab === "employer"
                    ? "bg-orange-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                For Employers
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {currentTiers.map((tier) => {
            const colors = getColorClasses(tier.color, tier.recommended);
            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl p-8 ${colors.card} transition-all hover:shadow-2xl`}
              >
                {tier.recommended && (
                  <div
                    className={`absolute -top-4 left-1/2 -translate-x-1/2 ${colors.badge} text-white px-4 py-1 rounded-full text-sm font-semibold`}
                  >
                    Recommended
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className={`text-2xl font-bold ${colors.text} mb-2`}>
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-4xl font-extrabold ${colors.text}`}>
                      {tier.price}
                    </span>
                    {tier.priceNote && (
                      <span className="text-gray-600 text-lg">
                        {tier.priceNote}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-2 text-sm">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(tier)}
                  className={`w-full ${colors.button} text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-md`}
                >
                  {tier.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{item.question}</span>
                  {openFaq === index ? (
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <svg
                      className="h-5 w-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-orange-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Build Trust and Hire with Confidence?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of workers and employers using WorkVouch to verify work history and make better hiring decisions.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => (window.location.href = "/auth/signup")}
                className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-all shadow-lg"
              >
                Get Started Free
              </button>
              <button
                onClick={() => (window.location.href = "/contact")}
                className="border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-all"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
