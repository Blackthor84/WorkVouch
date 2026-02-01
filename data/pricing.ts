/**
 * Career Passport Platform pricing.
 * Employer: Lite, Pro, Enterprise. Employee: Free, Pro.
 * Not a job board. Verification + identity infrastructure.
 */

export const employerPlans = [
  {
    id: "lite",
    name: "Lite",
    price: 49,
    period: "month",
    features: [
      "25 verification reports",
      "Unlimited worker search",
      "Basic workforce dashboard",
      "Industry Mode (basic)",
    ],
    stripePriceId: process.env.STRIPE_PRICE_LITE,
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    period: "month",
    features: [
      "100 verification reports",
      "Credential tracking",
      "Compliance alerts",
      "Workforce Integrity Dashboard",
      "Bulk verification (up to 50)",
    ],
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    period: "custom",
    features: [
      "Unlimited verifications",
      "API access",
      "HR system sync",
      "Bulk upload 500+",
      "Advanced analytics",
      "Private data export",
      "Dedicated support",
    ],
    stripePriceId: null,
  },
];

export const employeePlans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "month",
    features: [
      "Public Career Passport",
      "Verified employment timeline",
      "Reference collection",
      "Profile strength visibility",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 9,
    period: "month",
    features: [
      "Advanced insights",
      "Downloadable verification PDF",
      "Industry badge",
      "Passport analytics (views + shares)",
    ],
    stripePriceId: process.env.STRIPE_PRICE_EMPLOYEE_PRO,
  },
];

export const payPerUse = {
  id: "one_time",
  name: "One-Time Report",
  price: 14.99,
  period: "report",
  features: [
    "Confirmed job history",
    "Peer verification summary",
    "Profile strength breakdown",
    "Exportable PDF",
    "Contact peers",
  ],
  stripePriceId: process.env.STRIPE_PRICE_ONE_TIME,
};
