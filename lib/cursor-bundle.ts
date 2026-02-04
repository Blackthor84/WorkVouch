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
// Pricing Tiers (employer plans: use EMPLOYER_PLANS from @/lib/pricing/employer-plans)
// ===============================

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
