/**
 * Static mock data for Demo Mode. No database or API calls.
 * 3 profiles per industry: high tenure, high distribution, lower score.
 */

export type DemoIndustry =
  | "security"
  | "healthcare"
  | "warehouse"
  | "retail"
  | "hospitality"
  | "law_enforcement";

export interface DemoProfile {
  name: string;
  trustScore: number;
  verifiedEmployments: number;
  totalYears: number;
  avgRating: number;
  referenceCount: number;
  distribution: number;
  /** Same as distribution: unique employers with references (for prompt structure). */
  uniqueEmployers: number;
  fraudFlags: number;
  rehireEligible: boolean;
}

export const demoProfiles: Record<DemoIndustry, DemoProfile[]> = {
  security: [
    {
      name: "Michael Torres",
      trustScore: 91,
      verifiedEmployments: 1,
      totalYears: 10,
      avgRating: 4.8,
      referenceCount: 3,
      distribution: 1,
      uniqueEmployers: 1,
      fraudFlags: 0,
      rehireEligible: true,
    },
    {
      name: "James Chen",
      trustScore: 78,
      verifiedEmployments: 2,
      totalYears: 4,
      avgRating: 4.2,
      referenceCount: 5,
      distribution: 2,
      uniqueEmployers: 2,
      fraudFlags: 0,
      rehireEligible: true,
    },
    {
      name: "David Park",
      trustScore: 62,
      verifiedEmployments: 1,
      totalYears: 2,
      avgRating: 3.8,
      referenceCount: 1,
      distribution: 1,
      uniqueEmployers: 1,
      fraudFlags: 0,
      rehireEligible: false,
    },
  ],
  healthcare: [
    {
      name: "Sarah Mitchell",
      trustScore: 94,
      verifiedEmployments: 2,
      totalYears: 12,
      avgRating: 4.9,
      referenceCount: 4,
      distribution: 2,
      uniqueEmployers: 2,
      fraudFlags: 0,
      rehireEligible: true,
    },
    {
      name: "Emily Rodriguez",
      trustScore: 82,
      verifiedEmployments: 3,
      totalYears: 5,
      avgRating: 4.5,
      referenceCount: 6,
      distribution: 3,
      uniqueEmployers: 3,
      fraudFlags: 0,
      rehireEligible: true,
    },
    {
      name: "Lisa Wong",
      trustScore: 58,
      verifiedEmployments: 1,
      totalYears: 1,
      avgRating: 3.5,
      referenceCount: 2,
      distribution: 1,
      uniqueEmployers: 1,
      fraudFlags: 0,
      rehireEligible: false,
    },
  ],
  warehouse: [
    {
      name: "Carlos Mendez",
      trustScore: 88,
      verifiedEmployments: 1,
      totalYears: 8,
      avgRating: 4.6,
      referenceCount: 4,
      distribution: 1,
      uniqueEmployers: 1,
      fraudFlags: 0,
      rehireEligible: true,
    },
    {
      name: "Anthony Brooks",
      trustScore: 75,
      verifiedEmployments: 2,
      totalYears: 3,
      avgRating: 4.0,
      referenceCount: 5,
      distribution: 2,
      uniqueEmployers: 2,
      fraudFlags: 0,
      rehireEligible: true,
    },
    {
      name: "Marcus Johnson",
      trustScore: 55,
      verifiedEmployments: 1,
      totalYears: 1,
      avgRating: 3.2,
      referenceCount: 1,
      distribution: 1,
      uniqueEmployers: 1,
      fraudFlags: 1,
      rehireEligible: false,
    },
  ],
  retail: [
    {
      name: "Jessica Adams",
      trustScore: 90,
      verifiedEmployments: 2,
      totalYears: 9,
      avgRating: 4.7,
      referenceCount: 5,
      distribution: 2,
      uniqueEmployers: 2,
      fraudFlags: 0,
      rehireEligible: true,
    },
    {
      name: "Ryan Foster",
      trustScore: 80,
      verifiedEmployments: 3,
      totalYears: 4,
      avgRating: 4.3,
      referenceCount: 7,
      distribution: 3,
      uniqueEmployers: 3,
      fraudFlags: 0,
      rehireEligible: true,
    },
    {
      name: "Amanda Lee",
      trustScore: 59,
      verifiedEmployments: 1,
      totalYears: 2,
      avgRating: 3.6,
      referenceCount: 2,
      distribution: 1,
      uniqueEmployers: 1,
      fraudFlags: 0,
      rehireEligible: false,
    },
  ],
  hospitality: [
    {
      name: "Nicole Martinez",
      trustScore: 92,
      verifiedEmployments: 2,
      totalYears: 11,
      avgRating: 4.8,
      referenceCount: 6,
      distribution: 2,
      uniqueEmployers: 2,
      fraudFlags: 0,
      rehireEligible: true,
    },
    {
      name: "Kevin O'Brien",
      trustScore: 76,
      verifiedEmployments: 2,
      totalYears: 4,
      avgRating: 4.1,
      referenceCount: 4,
      distribution: 2,
      uniqueEmployers: 2,
      fraudFlags: 0,
      rehireEligible: true,
    },
    {
      name: "Rachel Green",
      trustScore: 61,
      verifiedEmployments: 1,
      totalYears: 1,
      avgRating: 3.4,
      referenceCount: 1,
      distribution: 1,
      uniqueEmployers: 1,
      fraudFlags: 0,
      rehireEligible: false,
    },
  ],
  law_enforcement: [
    {
      name: "Daniel Hayes",
      trustScore: 95,
      verifiedEmployments: 1,
      totalYears: 14,
      avgRating: 4.9,
      referenceCount: 4,
      distribution: 1,
      uniqueEmployers: 1,
      fraudFlags: 0,
      rehireEligible: true,
    },
    {
      name: "Jennifer Walsh",
      trustScore: 84,
      verifiedEmployments: 2,
      totalYears: 6,
      avgRating: 4.6,
      referenceCount: 5,
      distribution: 2,
      uniqueEmployers: 2,
      fraudFlags: 0,
      rehireEligible: true,
    },
    {
      name: "Robert Kim",
      trustScore: 57,
      verifiedEmployments: 1,
      totalYears: 2,
      avgRating: 3.3,
      referenceCount: 2,
      distribution: 1,
      uniqueEmployers: 1,
      fraudFlags: 0,
      rehireEligible: false,
    },
  ],
};

export const demoIndustryLabels: Record<DemoIndustry, string> = {
  security: "Security",
  healthcare: "Healthcare",
  warehouse: "Warehouse",
  retail: "Retail",
  hospitality: "Hospitality",
  law_enforcement: "Law Enforcement",
};

export const DEMO_INDUSTRIES: DemoIndustry[] = [
  "security",
  "healthcare",
  "warehouse",
  "retail",
  "hospitality",
  "law_enforcement",
];
