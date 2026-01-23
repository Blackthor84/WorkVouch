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
    tier: "Starter",
    price: "$19/mo",
    benefits: [
      "Post up to 5 jobs per month",
      "Access to verified candidates",
      "Basic candidate analytics",
    ],
  },
  {
    tier: "Growth",
    price: "$49/mo",
    benefits: [
      "Post up to 20 jobs per month",
      "Advanced candidate analytics",
      "Priority support",
      "Team collaboration features",
    ],
  },
  {
    tier: "Pro",
    price: "$99/mo",
    benefits: [
      "Unlimited job postings",
      "Full access to candidate database",
      "Dedicated account manager",
      "Custom integrations",
      "Advanced performance metrics",
    ],
  },
];

export const employeePricing: PricingTier[] = [
  {
    tier: "Free",
    price: "$0",
    benefits: [
      "Build your WorkVouch profile",
      "Receive peer endorsements",
      "Apply to public jobs",
    ],
  },
  {
    tier: "Premium",
    price: "$9.99/mo",
    benefits: [
      "Highlight top skills",
      "Priority job application visibility",
      "Advanced analytics on your profile",
      "Exclusive premium job postings",
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
