// lib/careers.ts
// Career data and helper functions
// Can be easily replaced with database queries later

import { getIndustryImage } from "@/lib/constants/industries";

export interface CareerData {
  slug: string;
  name: string;
  image?: string;
  description?: string;
  employers?: string[];
  employees?: string[];
}

// Static career data (can be replaced with database query)
// Image paths from INDUSTRY_IMAGES (lib/constants/industries.ts)
const careersData: CareerData[] = [
  {
    slug: "education",
    name: "Education",
    image: getIndustryImage("education"),
    description: "Verified employment for educators",
    employers: [
      "Hire teachers with verified classroom experience.",
      "Check tenure, peer sentiment, and rehire signals.",
      "Reduce turnover with verified educator profiles.",
    ],
    employees: [
      "Showcase your teaching experience and credentials.",
      "Build credibility with verified peer references.",
      "Open opportunities at schools and districts.",
    ],
  },
  {
    slug: "construction",
    name: "Construction",
    image: getIndustryImage("construction"),
    description: "Verified employment for construction and trades",
    employers: [
      "Hire crew with verified work history and safety signals.",
      "Check certifications and job-site reliability.",
      "Reduce risk with peer-verified references.",
    ],
    employees: [
      "Showcase your trade experience and certifications.",
      "Build credibility with verified employer endorsements.",
      "Access opportunities at top construction firms.",
    ],
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    image: getIndustryImage("healthcare"),
    description: "Verified employment for healthcare professionals",
    employers: [
      "Hire qualified healthcare staff quickly.",
      "Verify credentials and work history instantly.",
      "Reduce hiring risk with peer-verified references.",
    ],
    employees: [
      "Showcase your healthcare experience and credentials.",
      "Gain credibility with verified employer endorsements.",
      "Open opportunities at top healthcare facilities.",
    ],
  },
  {
    slug: "security",
    name: "Security",
    image: getIndustryImage("security"),
    description: "Trusted profiles for security professionals",
    employers: [
      "Hire reliable security personnel with verified backgrounds.",
      "Check previous security experience and certifications.",
      "Ensure trust with peer-reviewed references.",
    ],
    employees: [
      "Highlight your security training and experience.",
      "Build credibility with verified work history.",
      "Access premium security roles with trusted profiles.",
    ],
  },
  {
    slug: "law-enforcement",
    name: "Law Enforcement",
    image: getIndustryImage("law-enforcement"),
    description: "Verified employment for law enforcement",
    employers: [
      "Hire officers with verified service records.",
      "Check background and experience instantly.",
      "Ensure reliability with peer-verified references.",
    ],
    employees: [
      "Showcase your law enforcement experience.",
      "Gain credibility with verified service records.",
      "Open opportunities with trusted profiles.",
    ],
  },
  {
    slug: "warehouse",
    name: "Warehouse & Logistics",
    image: getIndustryImage("warehouse"),
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
    image: getIndustryImage("hospitality"),
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
    image: getIndustryImage("retail"),
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

/**
 * Fetch career data by slug (can use database or static data)
 */
export async function fetchCareerData(slug: string): Promise<CareerData | null> {
  // Try Supabase first, fallback to static data
  try {
    const { createServerSupabase } = await import('@/lib/supabase/server');
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('careers')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!error && data) {
      const row = data as { slug?: string; name?: string; description?: string | null; image?: string | null; employers?: number | null; employees?: number | null };
      return {
        slug: row.slug || slug,
        name: row.name ?? "",
        description: row.description ?? undefined,
        image: row.image ?? undefined,
        employers: undefined,
        employees: undefined,
      };
    }
  } catch (error) {
    // Fallback to static data if Supabase fails
    console.error('Error fetching from Supabase, using static data:', error);
  }

  // Fallback to static data
  return getCareerBySlug(slug);
}
