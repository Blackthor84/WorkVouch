// ===============================
// TypeScript Types for Careers & Pricing
// ===============================

export type Career = {
  name: string;
  description?: string;
  employees: string[];
  employers: string[];
};

export interface CareersPageProps {
  career: Career;
}

// Pricing tier
export interface PricingTier {
  tier: string;
  price: string;
  benefits: string[];
}

// ===============================
// Pricing Tiers
// ===============================

export const employerPricing: PricingTier[] = [
  {
    tier: "starter",
    price: "$49/mo",
    benefits: [
      "15 worker profile searches/month",
      "10 verification reports/month",
      "Contact verified coworkers",
      "Basic trust scores",
      "Export verification PDF",
    ],
  },
  {
    tier: "team",
    price: "$149/mo",
    benefits: [
      "50 searches/month",
      "40 verification reports",
      "Unlimited coworker messaging",
      "Advanced trust analytics",
      "New hire tracking dashboard",
      "Priority chat support",
    ],
  },
  {
    tier: "pro",
    price: "$299/mo",
    benefits: [
      "150 searches/month",
      "120 verification reports",
      "Department subaccounts",
      "Bulk worker import & auto-verification",
      "Role-based permissions",
      "Applicant comparison tools",
    ],
  },
  {
    tier: "security-bundle",
    price: "$199/mo",
    benefits: [
      "80 verification reports/month",
      "Unlimited worker searches",
      "Unlimited coworker messaging",
      "Upload guard licenses & certificates",
      "Auto-flag inconsistent claims",
      "Guard availability tools",
    ],
  },
  {
    tier: "pay-per-use",
    price: "$14.99/report",
    benefits: [
      "One-time report purchase",
      "After purchase → instantly unlock PDF",
    ],
  },
];

export const employeePricing: PricingTier[] = [
  {
    tier: "free",
    price: "Always Free",
    benefits: [
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
];

// ===============================
// Example Careers Data
// ===============================

export const careers: Career[] = [
  {
    name: "Software Engineer",
    description: "Develops software and maintains systems",
    employees: ["Good pay", "Flexible hours", "Remote options"],
    employers: ["Verified candidates", "Easy tracking", "Performance metrics"],
  },
  {
    name: "Healthcare Worker",
    description: "Provides care for patients",
    employees: ["Competitive pay", "Healthcare benefits", "Scheduling flexibility"],
    employers: ["Reliable staff", "Credential verification", "Shift management"],
  },
  {
    name: "Retail Associate",
    description: "Assists customers in stores",
    employees: ["Discounts", "Flexible shifts", "Training opportunities"],
    employers: ["Trained staff", "Shift scheduling", "Performance tracking"],
  },
];

// ===============================
// Dynamic Paths Helper (Next.js style)
// ===============================

export function generateCareerPaths() {
  return careers.map((career) => ({
    params: { career: career.name.toLowerCase().replace(/\s+/g, "-") },
  }));
}

export function getCareerData(careerSlug: string) {
  return careers.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, "-") === careerSlug
  );
}
