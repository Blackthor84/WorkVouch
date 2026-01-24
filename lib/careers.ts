// lib/careers.ts
// Career data and helper functions
// Can be easily replaced with database queries later

export interface CareerData {
  slug: string;
  name: string;
  image?: string;
  description?: string;
  employers?: string[];
  employees?: string[];
}

// Static career data (can be replaced with database query)
const careersData: CareerData[] = [
  {
    slug: "healthcare",
    name: "Healthcare",
    image: "/careers/healthcare.jpg",
    description: "Verified work history for healthcare professionals",
    employers: [
      "Verify skilled staff quickly and efficiently.",
      "Reduce hiring risk with peer-reviewed references.",
      "Streamline onboarding with trusted employee history.",
    ],
    employees: [
      "Showcase your verified experience to top employers.",
      "Gain recognition for your healthcare skills.",
      "Increase opportunities with credible references.",
    ],
  },
  {
    slug: "law_enforcement",
    name: "Law Enforcement",
    image: "/careers/law.jpg",
    description: "Trusted profiles for law enforcement professionals",
    employers: [
      "Ensure officers meet verified credentials and background checks.",
      "Save time on reference verification.",
      "Hire candidates with trustworthy peer recommendations.",
    ],
    employees: [
      "Demonstrate your law enforcement experience instantly.",
      "Build trust with potential departments.",
      "Stand out with verified endorsements from past colleagues.",
    ],
  },
  {
    slug: "security",
    name: "Security",
    image: "/careers/security.jpg",
    description: "Verified work history for security professionals",
    employers: [
      "Quickly verify guards and staff for contracts.",
      "Minimize hiring risks with verified work history.",
      "Hire trusted employees with peer-validated references.",
    ],
    employees: [
      "Prove your reliability with verified work records.",
      "Highlight skills to multiple security firms.",
      "Increase employability with trusted peer reviews.",
    ],
  },
  {
    slug: "warehouse",
    name: "Warehouse & Logistics",
    image: "/careers/warehouse.jpg",
    description: "Verified employment for warehouse & logistics",
    employers: [
      "Hire reliable warehouse staff fast.",
      "Check previous work history and reliability instantly.",
      "Reduce turnover with verified employees.",
    ],
    employees: [
      "Showcase experience in logistics and warehouse operations.",
      "Gain credibility with verified employer endorsements.",
      "Open opportunities at top logistics companies.",
    ],
  },
  {
    slug: "hospitality",
    name: "Hospitality",
    image: "/careers/hospitality.jpg",
    description: "Build credibility in hospitality careers",
    employers: [
      "Hire staff with verified customer service experience.",
      "Ensure quality with peer-reviewed references.",
      "Reduce turnover and onboarding time.",
    ],
    employees: [
      "Highlight your hospitality and service experience.",
      "Get recognized by top hotels and restaurants.",
      "Prove your reliability with verified references.",
    ],
  },
  {
    slug: "retail",
    name: "Retail",
    image: "/careers/retail.jpg",
    description: "Trusted profiles for retail professionals",
    employers: [
      "Quickly hire trusted retail staff.",
      "Verify sales experience and reliability.",
      "Minimize hiring risk with peer-verified references.",
    ],
    employees: [
      "Showcase your retail and customer service experience.",
      "Build credibility with previous employers.",
      "Stand out in a competitive retail job market.",
    ],
  },
];

/**
 * Get all careers (for static generation)
 * Replace with database query when ready
 */
export async function getCareers(): Promise<CareerData[]> {
  // Simulate async operation (replace with actual DB query)
  return Promise.resolve(careersData);
}

/**
 * Get a single career by slug
 * Replace with database query when ready
 */
export async function getCareerBySlug(slug: string): Promise<CareerData | null> {
  const career = careersData.find((c) => c.slug === slug);
  return Promise.resolve(career || null);
}
