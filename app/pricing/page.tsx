"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";

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

const employeeTier: PricingTier = {
  id: "free",
  name: "Free Forever",
  price: "Always Free",
  priceNote: "",
  description: "Always free for employees — no hidden fees, no trials, no limits.",
  color: "blue",
  recommended: true,
  features: [
    "Verified job history",
    "Peer references",
    "Transparent reviews",
    "Unlimited job entries",
    "Unlimited coworker connections",
    "Build your verified profile",
    "Get discovered by employers",
    "No credit card required",
    "No subscriptions, ever",
  ],
  cta: "Get Started Free",
};

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
    question: "Is WorkVouch really free for workers?",
    answer:
      "Yes! WorkVouch is completely free for workers, forever. There are no subscriptions, no hidden fees, and no credit card required. You can add unlimited job history, receive unlimited peer references, and build your verified profile at no cost. We believe verified work history should be accessible to everyone.",
  },
  {
    question: "Do I need to pay to upgrade my account later?",
    answer:
      "No! WorkVouch is always free for workers. There are no paid tiers or upgrades. All features are available to you at no cost. Your verified work history and references remain intact and accessible forever.",
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
  const sessionObj = useSession();
  const session = sessionObj?.data ?? null;
  const [activeTab, setActiveTab] = useState<"employee" | "employer">("employee");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const user = session?.user ?? null;
  const isBeta = user?.role === "beta" || 
                 (Array.isArray(user?.roles) && user?.roles.includes("beta"));

  const handleSubscribe = async (tier: PricingTier) => {
    try {
      const { stripePlans } = await import("@/lib/stripePlans");
      
      const priceIdMap: Record<string, string> = {
        starter: stripePlans.starter,
        team: stripePlans.team,
        pro: stripePlans.pro,
        "pay-per-use": stripePlans.payPerUse,
        "security-bundle": stripePlans.securityBundle,
        free: stripePlans.workerFree,
      };
      
      const actualPriceId = priceIdMap[tier.id] || tier.stripePriceId;
      
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tierId: tier.id,
          priceId: actualPriceId,
          userType: "employer",
          successUrl: `${window.location.origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      alert(`Failed to start checkout: ${error.message}`);
    }
  };

  const getColorClasses = (color: PricingTier["color"], isRecommended?: boolean) => {
    const colors = {
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-500",
        text: "text-blue-700",
        button: "bg-[#1A73E8] hover:bg-blue-700",
        badge: "bg-[#1A73E8]",
      },
      orange: {
        bg: "bg-orange-50",
        border: "border-orange-500",
        text: "text-orange-700",
        button: "bg-[#1A73E8] hover:bg-blue-700",
        badge: "bg-orange-600",
      },
      green: {
        bg: "bg-green-50",
        border: "border-green-500",
        text: "text-green-700",
        button: "bg-[#1A73E8] hover:bg-blue-700",
        badge: "bg-green-600",
      },
      gray: {
        bg: "bg-gray-50",
        border: "border-gray-500",
        text: "text-gray-700",
        button: "bg-[#1A73E8] hover:bg-blue-700",
        badge: "bg-gray-600",
      },
    };

    const base = colors[color];
    return {
      ...base,
      card: isRecommended
        ? `${base.bg} ${base.border} border-4 shadow-xl`
        : `${base.bg} ${base.border} border-2 shadow-lg`,
    };
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center mb-4">
            WorkVouch Pricing
          </h1>
          <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto">
            {activeTab === "employee" 
              ? "Always free for employees — no hidden fees, no trials, no limits."
              : "Build credibility. Hire with confidence. Choose the plan that fits your needs."}
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-lg border-2 border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveTab("employee")}
              className={`px-6 py-3 rounded-md font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2 ${
                activeTab === "employee"
                  ? "bg-[#1A73E8] text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              aria-label="View employee pricing"
            >
              For Workers
            </button>
            <button
              onClick={() => setActiveTab("employer")}
              className={`px-6 py-3 rounded-md font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2 ${
                activeTab === "employer"
                  ? "bg-[#1A73E8] text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              aria-label="View employer pricing"
            >
              For Employers
            </button>
          </div>
        </div>

        {/* Employee Tier - Single Large Card */}
        {activeTab === "employee" && (
          <div className="max-w-2xl mx-auto mb-16">
            <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 border-4 border-[#1A73E8] rounded-2xl p-8 md:p-12 shadow-2xl">
              {/* Free Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1A73E8] text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                Always Free
              </div>

              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {employeeTier.name}
                </h2>
                <div className="flex items-baseline justify-center gap-2 mb-4">
                  <span className="text-5xl md:text-6xl font-extrabold text-[#1A73E8]">
                    {employeeTier.price}
                  </span>
                </div>
                <p className="text-lg text-gray-700 font-medium">
                  {employeeTier.description}
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {employeeTier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-gray-800 text-base">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/signup"
                className="block w-full bg-[#1A73E8] text-white font-bold py-4 px-6 rounded-lg text-center text-lg transition-all transform hover:scale-105 hover:bg-blue-700 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2"
                aria-label="Get started free with WorkVouch"
              >
                {employeeTier.cta}
              </Link>
            </div>
          </div>
        )}

        {/* Employer Tiers - Grid Layout */}
        {activeTab === "employer" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {employerTiers.map((tier) => {
              const colors = getColorClasses(tier.color, tier.recommended);
              
              return (
                <div
                  key={tier.id}
                  className={`relative rounded-2xl p-6 ${colors.card} transition-all hover:shadow-2xl ${
                    isBeta ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {tier.recommended && (
                    <div
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 ${colors.badge} text-white px-4 py-1 rounded-full text-xs font-semibold`}
                    >
                      Recommended
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className={`text-2xl font-bold ${colors.text} mb-2`}>
                      {tier.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1 mb-2">
                      <span className={`text-4xl font-extrabold ${colors.text}`}>
                        {tier.price}
                      </span>
                      {tier.priceNote && (
                        <span className="text-gray-600 text-lg">
                          {tier.priceNote}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{tier.description}</p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isBeta ? (
                    <div className="w-full bg-gray-300 text-gray-600 font-semibold py-3 px-6 rounded-lg text-center">
                      Preview Mode
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(tier)}
                      className={`w-full ${colors.button} text-white font-semibold py-3 px-6 rounded-lg text-center transition-all transform hover:scale-105 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2`}
                      aria-label={`Subscribe to ${tier.name} plan`}
                    >
                      {tier.cta}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Trust Building Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Why Choose WorkVouch?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="h-8 w-8 text-[#1A73E8]" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified Job History</h3>
              <p className="text-gray-600">
                Every job is verified by former coworkers, ensuring accuracy and trust.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="h-8 w-8 text-[#1A73E8]" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Peer References</h3>
              <p className="text-gray-600">
                Get authentic references from people who actually worked with you.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="h-8 w-8 text-[#1A73E8]" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Transparent Reviews</h3>
              <p className="text-gray-600">
                Honest, verified reviews that help both workers and employers make better decisions.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mb-16">
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
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2"
                  aria-expanded={openFaq === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="font-semibold text-gray-900 pr-4">{item.question}</span>
                  <ChevronDownIcon
                    className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-transform ${
                      openFaq === index ? "transform rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {openFaq === index && (
                  <div
                    id={`faq-answer-${index}`}
                    className="px-6 py-4 bg-gray-50 border-t border-gray-200"
                  >
                    <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#1A73E8] to-blue-600 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Build Trust and Hire with Confidence?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of workers and employers using WorkVouch to verify work history and make better hiring decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-white text-[#1A73E8] font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1A73E8]"
              aria-label="Get started free with WorkVouch"
            >
              Get Started Free
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-[#1A73E8] transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1A73E8]"
              aria-label="Contact sales team"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
