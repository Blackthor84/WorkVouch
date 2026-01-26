/**
 * WorkVouch Stripe Price IDs Configuration
 * 
 * IMPORTANT: Replace the placeholder price IDs below with your actual Stripe Price IDs
 * from your Stripe Dashboard after creating the products.
 * 
 * To get your Price IDs:
 * 1. Go to Stripe Dashboard > Products
 * 2. Click on each product
 * 3. Copy the Price ID (starts with "price_")
 * 4. Replace the placeholders below
 */

export const stripePlans = {
  // Employer Plans
  starter: process.env.STRIPE_PRICE_STARTER || "price_starter_monthly",
  team: process.env.STRIPE_PRICE_TEAM || "price_team_monthly",
  pro: process.env.STRIPE_PRICE_PRO || "price_pro_monthly",
  
  // One-time Payment
  payPerUse: process.env.STRIPE_PRICE_PAY_PER_USE || "price_pay_per_use_report",
  
  // Security Bundle
  securityBundle: process.env.STRIPE_PRICE_SECURITY_BUNDLE || "price_security_bundle",
  
  // Worker Free Plan (always free)
  workerFree: process.env.STRIPE_PRICE_WORKER_FREE || "price_worker_free",
} as const;

/**
 * Plan metadata for feature gating
 */
export const planFeatures = {
  starter: {
    name: "Starter (Employer)",
    price: 49,
    searchesPerMonth: 15,
    reportsPerMonth: 10,
    features: [
      "15 worker profile searches/month",
      "10 verification reports/month",
      "Contact verified coworkers",
      "Basic trust scores",
      "Export verification PDF",
    ],
  },
  team: {
    name: "Team (Employer)",
    price: 149,
    searchesPerMonth: 50,
    reportsPerMonth: 40,
    features: [
      "50 searches/month",
      "40 verification reports",
      "Unlimited coworker messaging",
      "Advanced trust analytics",
      "New hire tracking dashboard",
      "Priority chat support",
    ],
  },
  pro: {
    name: "Pro (Employer)",
    price: 299,
    searchesPerMonth: 150,
    reportsPerMonth: 120,
    features: [
      "150 searches/month",
      "120 verification reports",
      "Department subaccounts",
      "Bulk worker import & auto-verification",
      "Role-based permissions",
      "Applicant comparison tools",
    ],
  },
  payPerUse: {
    name: "Pay-Per-Use Report",
    price: 14.99,
    searchesPerMonth: 0,
    reportsPerMonth: 1, // One-time report
    features: [
      "One-time report purchase",
      "After purchase → instantly unlock PDF",
    ],
  },
  securityBundle: {
    name: "Security Agency Bundle",
    price: 199,
    searchesPerMonth: -1, // Unlimited
    reportsPerMonth: 80,
    features: [
      "80 verification reports",
      "Unlimited searches",
      "Unlimited messaging",
      "Upload guard licenses",
      "Upload certificates & training",
      "Auto-flag inconsistent claims",
      "Guard availability + shift preference tools",
    ],
  },
  workerFree: {
    name: "Worker Free Plan",
    price: 0,
    searchesPerMonth: 0,
    reportsPerMonth: 0,
    features: [
      "Create a profile",
      "Upload experience",
      "Add job history",
      "Match with coworkers",
      "Give/receive peer references",
      "Generate worker public profile",
      "View trust score",
      "Request coworker verifications",
    ],
  },
} as const;

/**
 * Get plan features by tier ID
 */
export function getPlanFeatures(tierId: string) {
  return planFeatures[tierId as keyof typeof planFeatures] || planFeatures.workerFree;
}

/**
 * Check if tier has unlimited searches
 */
export function hasUnlimitedSearches(tierId: string): boolean {
  const features = getPlanFeatures(tierId);
  return features.searchesPerMonth === -1;
}

/**
 * Check if tier has unlimited reports
 */
export function hasUnlimitedReports(tierId: string): boolean {
  const features = getPlanFeatures(tierId);
  return features.reportsPerMonth === -1;
}
