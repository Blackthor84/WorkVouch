/**
 * Pricing data. Employer: Starter, Pro, Custom only.
 * Verification + trusted work history. No analytics/risk/compliance/intelligence.
 */

import { EMPLOYER_PLANS } from "@/lib/pricing/employer-plans";

export const employerPlans = EMPLOYER_PLANS.map((p) => ({
  id: p.id,
  name: p.name,
  price: p.priceMonthly,
  priceYearly: p.priceYearly,
  period: "month" as const,
  features: p.features,
  stripePriceIdMonthly: p.stripePriceIdMonthly,
  stripePriceIdYearly: p.stripePriceIdYearly,
  cta: p.cta,
  ctaHref: p.ctaHref,
  badge: p.badge,
}));

export const employeePlans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "month" as const,
    features: [
      "Public profile",
      "Verified employment timeline",
      "Reference collection",
      "Profile visibility",
    ],
  },
];
