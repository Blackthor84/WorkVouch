"use client";

import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  STRIPE_PRODUCTS,
  getUserProducts,
  getEmployerProducts,
  productIdToTier,
} from "@/lib/stripe/products";
import { CheckIcon } from "@heroicons/react/24/solid";

interface PricingSectionProps {
  currentUserId?: string;
}

export function PricingSection({ currentUserId }: PricingSectionProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"user" | "employer">("user");

  const userProducts = getUserProducts();
  const employerProducts = getEmployerProducts();
  const payPerLookup = STRIPE_PRODUCTS.find((p) => p.id === "lookup");

  const handleSubscribe = async (priceId: string) => {
    if (!currentUserId) {
      window.location.href = "/auth/signup";
      return;
    }

    setLoading(priceId);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create checkout session");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      alert(error.message || "Failed to create checkout session");
      setLoading(null);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  return (
    <div className="space-y-12">
      {/* Tab Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl bg-white dark:bg-[#1A1F2B] p-1 border border-grey-background dark:border-[#374151]">
          <button
            onClick={() => setActiveTab("user")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === "user"
                ? "bg-blue-600 dark:bg-blue-500 text-white"
                : "text-grey-medium dark:text-gray-400 hover:text-grey-dark dark:hover:text-gray-200"
            }`}
          >
            For Users
          </button>
          <button
            onClick={() => setActiveTab("employer")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === "employer"
                ? "bg-blue-600 dark:bg-blue-500 text-white"
                : "text-grey-medium dark:text-gray-400 hover:text-grey-dark dark:hover:text-gray-200"
            }`}
          >
            For Employers
          </button>
        </div>
      </div>

      {/* User Plans */}
      {activeTab === "user" && (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {userProducts.map((product) => {
            const tier = productIdToTier(product.id);
            const isPro = product.id === "peer-pro";
            const monthlyPrice = product.prices.find(
              (p) => p.recurring?.interval === "month",
            );

            return (
              <div
                key={product.id}
                className={`rounded-2xl p-8 shadow-lg border ${
                  isPro
                    ? "bg-blue-600 dark:bg-blue-500 text-white transform scale-105 z-10"
                    : "bg-white dark:bg-[#1A1F2B] border-grey-background dark:border-[#374151]"
                }`}
              >
                <h3
                  className={`text-xl font-semibold mb-2 ${
                    isPro ? "text-white" : "text-grey-dark dark:text-gray-200"
                  }`}
                >
                  {product.name.replace("WorkVouch ", "")}
                </h3>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    isPro
                      ? "text-blue-100"
                      : "text-grey-medium dark:text-gray-400"
                  }`}
                >
                  {product.description}
                </p>
                <div
                  className={`text-4xl font-bold mt-6 ${
                    isPro ? "text-white" : "text-grey-dark dark:text-gray-200"
                  }`}
                >
                  {product.prices.length > 0 && monthlyPrice
                    ? `${formatPrice(monthlyPrice.unit_amount)}/mo`
                    : "$0"}
                </div>
                <ul
                  className={`mt-6 space-y-3 ${
                    isPro ? "text-white" : "text-grey-dark dark:text-gray-300"
                  }`}
                >
                  {getFeaturesForTier(tier).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mr-2">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {product.prices.length > 0 && monthlyPrice ? (
                  <Button
                    className={`w-full mt-8 ${
                      isPro
                        ? "bg-white text-blue-700 hover:bg-gray-200 dark:bg-white dark:text-blue-700"
                        : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white"
                    }`}
                    onClick={() => {
                      // TODO: Replace with actual Stripe price ID
                      // For now, this is a placeholder - you'll need to get the actual price ID
                      // from your Stripe dashboard and pass it here
                      const priceId = "price_placeholder"; // Replace with actual price ID
                      if (priceId && priceId !== "price_placeholder") {
                        handleSubscribe(priceId);
                      } else {
                        alert(
                          "Please configure Stripe price IDs. Add your actual price IDs to the pricing component.",
                        );
                      }
                    }}
                    disabled={loading === monthlyPrice.nickname}
                  >
                    {loading === monthlyPrice.nickname
                      ? "Loading..."
                      : product.id === "peer-pro"
                        ? "Upgrade to Pro"
                        : product.id === "peer-elite"
                          ? "Become Elite"
                          : "Subscribe"}
                  </Button>
                ) : (
                  <Button
                    className="w-full mt-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white"
                    href="/auth/signup"
                  >
                    Get Started
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Employer Plans */}
      {activeTab === "employer" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {employerProducts.map((product) => (
              <Card
                key={product.id}
                className={`p-8 relative ${
                  product.id === "emp-pro"
                    ? "border-2 border-blue-600 dark:border-blue-500 ring-2 ring-blue-600/20 dark:ring-blue-500/20"
                    : ""
                }`}
              >
                {product.id === "emp-pro" && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-2">
                  {product.name}
                </h3>
                <p className="text-grey-medium dark:text-gray-400 mb-6">
                  {product.description}
                </p>
                {product.prices.map((price) => (
                  <div key={`${product.id}-${price.nickname}`}>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-bold text-grey-dark dark:text-gray-200">
                        {formatPrice(price.unit_amount)}
                      </span>
                      {price.recurring && (
                        <span className="text-grey-medium dark:text-gray-400">
                          /{price.recurring.interval}
                        </span>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      variant={
                        product.id === "emp-pro" ? "primary" : "secondary"
                      }
                      onClick={() => {
                        // TODO: Replace with actual Stripe price ID
                        const priceId = "price_placeholder"; // Replace with actual price ID
                        if (priceId && priceId !== "price_placeholder") {
                          handleSubscribe(priceId);
                        } else {
                          alert(
                            "Please configure Stripe price IDs. Add your actual price IDs to the pricing component.",
                          );
                        }
                      }}
                      disabled={loading === price.nickname}
                    >
                      {loading === price.nickname ? "Loading..." : "Subscribe"}
                    </Button>
                  </div>
                ))}
                <ul className="mt-6 space-y-2">
                  {getEmployerFeaturesForTier(productIdToTier(product.id)).map(
                    (feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-grey-dark dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </Card>
            ))}
          </div>

          {/* Pay-Per-Lookup Option */}
          {payPerLookup && (
            <Card className="p-8 max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-2">
                {payPerLookup.name}
              </h3>
              <p className="text-sm text-grey-medium dark:text-gray-400 mb-6 leading-relaxed">
                {payPerLookup.description}
              </p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-grey-dark dark:text-gray-200">
                  {formatPrice(payPerLookup.prices[0].unit_amount)}
                </span>
              </div>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => {
                  // TODO: Replace with actual Stripe price ID for pay-per-lookup
                  const priceId = "price_placeholder"; // Replace with actual price ID
                  if (priceId && priceId !== "price_placeholder") {
                    handleSubscribe(priceId);
                  } else {
                    alert(
                      "Please configure Stripe price IDs. Add your actual price IDs to the pricing component.",
                    );
                  }
                }}
                disabled={loading === "lookup"}
              >
                {loading === "lookup" ? "Processing..." : "Purchase Lookup"}
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function getFeaturesForTier(tier: string): string[] {
  const features: Record<string, string[]> = {
    starter: [
      "Unlimited jobs",
      "Basic coworker matching",
      "PeerScore Level 1",
      "3 coworker requests per job",
    ],
    pro: [
      "Everything in Starter",
      "PeerScore Level 2",
      "10 coworker requests per job",
      "AI résumé rewrite",
      "ATS optimization",
      "Profile analytics",
    ],
    elite: [
      "Everything in Pro",
      "PeerScore Level 3 (Verified)",
      "Unlimited coworker requests",
      "Full AI résumé rewrite + coaching",
      "Advanced ATS optimization",
      "Premium profile analytics",
      "Verified ID badge (included)",
      "Premium themes (included)",
      "Anonymous employer browsing",
      "Top 15% priority ranking",
      "Full AI Career Coach access",
    ],
  };
  return features[tier] || [];
}

function getEmployerFeaturesForTier(tier: string): string[] {
  const features: Record<string, string[]> = {
    emp_lite: [
      "20 profile lookups/month",
      "Full access to verified work history",
      "References access",
      "Candidate messaging",
    ],
    emp_pro: [
      "100 monthly lookups",
      "Priority matching",
      "ATS integrations",
      "Team management tools",
    ],
    emp_enterprise: [
      "Unlimited lookups",
      "Custom API access",
      "Turnover insights",
      "Dedicated account support",
    ],
  };
  return features[tier] || [];
}
