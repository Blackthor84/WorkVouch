export const employerPlans = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    period: "month",
    features: [
      "15 worker profile searches/month",
      "10 WorkVouch verification reports",
      "Contact verified coworkers",
      "Basic trust scores",
      "Export verification PDF"
    ],
    stripePriceId: process.env.STRIPE_PRICE_STARTER
  },
  {
    id: "team",
    name: "Team",
    price: 149,
    period: "month",
    features: [
      "50 searches/month",
      "40 verification reports",
      "Unlimited coworker messaging",
      "Advanced trust analytics",
      "New hire tracking dashboard",
      "Priority chat support"
    ],
    stripePriceId: process.env.STRIPE_PRICE_TEAM
  },
  {
    id: "pro",
    name: "Pro",
    price: 299,
    period: "month",
    features: [
      "150 searches/month",
      "120 verification reports",
      "Department subaccounts",
      "Bulk worker import & auto-verification",
      "Role-based permissions",
      "Applicant comparison tools"
    ],
    stripePriceId: process.env.STRIPE_PRICE_PRO
  },
  {
    id: "security",
    name: "Security Agency Bundle",
    price: 199,
    period: "month",
    features: [
      "80 verification reports/month",
      "Unlimited worker searches",
      "Unlimited coworker messaging",
      "Proof-of-work history for guards",
      "Upload guard licenses, certificates & training",
      "Auto-flag inconsistent claims",
      "Guard availability & shift preference tools"
    ],
    stripePriceId: process.env.STRIPE_PRICE_SECURITY_BUNDLE || process.env.STRIPE_PRICE_SECURITY
  }
];

export const payPerUse = {
  id: "pay_per_use",
  name: "Pay-Per-Use",
  price: 14.99,
  period: "report",
  features: [
    "Confirmed job history",
    "Peer verification summary",
    "Trust score breakdown",
    "Peer reliability insights",
    "Exportable PDF",
    "Contact peers"
  ],
  stripePriceId: process.env.STRIPE_PRICE_PAY_PER_USE
};
