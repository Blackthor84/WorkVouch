export type EmployerPlanId = "lite" | "pro" | "enterprise";

export interface EmployerPlan {
  id: EmployerPlanId;
  name: string;
  priceMonthly: number;
  description: string;
  features: string[];
  stripePriceId?: string;
}

export const EMPLOYER_PLANS: EmployerPlan[] = [
  {
    id: "lite",
    name: "Lite",
    priceMonthly: 29,
    description: "Verification essentials for small hiring teams.",
    features: [
      "25 worker searches / month",
      "15 verification reports / month",
      "Basic workforce risk insights",
      "Reputation + career health visibility",
      "Email support",
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_LITE_MONTHLY,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 79,
    description: "Advanced verification and risk intelligence.",
    features: [
      "100 worker searches / month",
      "75 verification reports / month",
      "Team Fit compatibility scoring",
      "Workforce Risk Dashboard",
      "Department role segmentation",
      "Priority support",
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 199,
    description: "Full intelligence engine + compliance oversight.",
    features: [
      "Unlimited searches",
      "Unlimited verification reports",
      "Advanced hiring confidence engine",
      "Network density + fraud confidence",
      "Compliance analytics",
      "Dedicated support",
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY,
  },
];

/** Resolve Stripe price ID for a plan (server or client). Prefer server env then NEXT_PUBLIC_. */
export function getStripePriceIdForPlan(planId: EmployerPlanId): string | undefined {
  const plan = EMPLOYER_PLANS.find((p) => p.id === planId);
  if (plan?.stripePriceId) return plan.stripePriceId;
  const serverId =
    planId === "lite"
      ? process.env.STRIPE_PRICE_LITE_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_LITE_MONTHLY
      : planId === "pro"
        ? process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY
        : process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY;
  return typeof serverId === "string" ? serverId : undefined;
}

/** Normalize legacy plan_tier from DB to canonical EmployerPlanId (migration safety). */
export function normalizeEmployerPlanId(tier: string | null | undefined): EmployerPlanId {
  if (!tier) return "lite";
  const t = tier.toLowerCase().replace(/-/g, "_");
  if (t === "lite" || t === "enterprise") return t as EmployerPlanId;
  if (t === "pro") return "pro";
  if (t === "starter" || t === "free" || t === "basic" || t === "pay_per_use") return "lite";
  if (t === "team" || t === "growth" || t === "security_bundle" || t === "security_agency") return "pro";
  return "lite";
}
