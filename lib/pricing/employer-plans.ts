/**
 * Employer plans: Starter, Pro, Custom only.
 * Verification + trusted work history infrastructure. No analytics/risk/compliance/intelligence language.
 */

export type EmployerPlanId = "starter" | "pro" | "custom";

export interface EmployerPlan {
  id: EmployerPlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  features: string[];
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  cta: string;
  ctaHref?: string;
  badge?: string;
}

export const EMPLOYER_PLANS: EmployerPlan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 49,
    priceYearly: 490,
    description: "For small hiring teams.",
    features: [
      "25 worker searches per month",
      "15 verification reports per month",
      "Verified work history visibility",
      "Contact confirmed coworkers",
      "Email support",
    ],
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY,
    stripePriceIdYearly: process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY,
    cta: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 149,
    priceYearly: 1490,
    description: "For growing teams hiring consistently.",
    features: [
      "100 worker searches per month",
      "75 verification reports per month",
      "Team visibility tools",
      "Priority email support",
      "Role-based access controls",
    ],
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY,
    stripePriceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY,
    cta: "Upgrade to Pro",
    badge: "Most Popular",
  },
  {
    id: "custom",
    name: "Custom",
    priceMonthly: 399,
    priceYearly: 3990,
    description: "For high-volume hiring teams.",
    features: [
      "Unlimited worker searches",
      "Unlimited verification reports",
      "Multi-location account management",
      "Dedicated support contact",
      "Custom onboarding assistance",
    ],
    cta: "Contact Sales",
    ctaHref: "/contact",
  },
];

/** Resolve Stripe price ID for a plan and interval (server or client). */
export function getStripePriceIdForPlan(
  planId: EmployerPlanId,
  interval: "monthly" | "yearly"
): string | undefined {
  const plan = EMPLOYER_PLANS.find((p) => p.id === planId);
  if (!plan) return undefined;
  const id =
    interval === "yearly"
      ? plan.stripePriceIdYearly
      : plan.stripePriceIdMonthly;
  if (id) return id;
  const env =
    interval === "yearly"
      ? (planId === "starter"
          ? process.env.STRIPE_PRICE_STARTER_YEARLY || process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY
          : process.env.STRIPE_PRICE_PRO_YEARLY || process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY)
      : (planId === "starter"
          ? process.env.STRIPE_PRICE_STARTER_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY
          : process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY);
  return typeof env === "string" ? env : undefined;
}

/** Normalize legacy plan_tier from DB to canonical EmployerPlanId. */
export function normalizeEmployerPlanId(tier: string | null | undefined): EmployerPlanId {
  if (!tier) return "starter";
  const t = tier.toLowerCase().replace(/-/g, "_");
  if (t === "starter" || t === "lite" || t === "free" || t === "basic" || t === "pay_per_use") return "starter";
  if (t === "pro" || t === "team" || t === "growth" || t === "security_bundle" || t === "security_agency" || t === "security") return "pro";
  if (t === "custom" || t === "enterprise") return "custom";
  return "starter";
}
