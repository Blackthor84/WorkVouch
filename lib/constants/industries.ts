/**
 * Single source of truth for industry.
 * INDUSTRIES: display names for dropdowns, API validation, sandbox + production.
 * ONBOARDING_KEYS + Industry (key type): onboarding route params and role/setting config.
 */

import { getCareersByIndustry } from "@/lib/careers/careers";

/** Single source for industry/career image paths. Use with getIndustryImage() so keys never mismatch. */
export const INDUSTRY_IMAGES: Record<string, string> = {
  healthcare: "/images/careers/healthcare.jpg",
  hospitality: "/images/careers/hospitality.jpg",
  retail: "/images/careers/retail.jpg",
  security: "/images/careers/security.jpg",
  warehouse: "/images/careers/warehouse.jpg",
  education: "/images/careers/Education.png",
  construction: "/images/careers/Construction.png",
  law_enforcement: "/images/careers/law.jpg",
  trades: "/images/careers/trades.jpg",
};

/** Career id / slug → INDUSTRY_IMAGES key (e.g. "law-enforcement" → "law_enforcement", "warehouse-logistics" → "warehouse"). */
const CAREER_ID_TO_IMAGE_KEY: Record<string, string> = {
  "law-enforcement": "law_enforcement",
  "warehouse-logistics": "warehouse",
  healthcare: "healthcare",
  hospitality: "hospitality",
  retail: "retail",
  security: "security",
  warehouse: "warehouse",
  education: "education",
  construction: "construction",
  trades: "trades",
  "skilled-trades": "trades",
};

/**
 * Resolve industry image path from career id, slug, or industry key.
 * Use everywhere instead of hardcoding paths.
 */
export function getIndustryImage(industryOrCareerId: string): string {
  const key = CAREER_ID_TO_IMAGE_KEY[industryOrCareerId] ?? industryOrCareerId.replace(/-/g, "_");
  return INDUSTRY_IMAGES[key] ?? INDUSTRY_IMAGES.healthcare;
}

/** Display name (e.g. "Healthcare", "Law Enforcement") → INDUSTRY_IMAGES key. */
const DISPLAY_NAME_TO_IMAGE_KEY: Record<string, string> = {
  Healthcare: "healthcare",
  "Law Enforcement": "law_enforcement",
  Security: "security",
  Retail: "retail",
  Hospitality: "hospitality",
  "Warehouse & Logistics": "warehouse",
  Education: "education",
  Construction: "construction",
  Trades: "trades",
  "Skilled Trades": "trades",
};

/** Resolve industry image from display name (e.g. career.name). */
export function getIndustryImageByName(displayName: string): string {
  const key = DISPLAY_NAME_TO_IMAGE_KEY[displayName];
  return key ? INDUSTRY_IMAGES[key] ?? INDUSTRY_IMAGES.healthcare : INDUSTRY_IMAGES.healthcare;
}

/** Shared industry options (display names) — use everywhere for dropdowns and validation. */
export const INDUSTRIES = [
  "Healthcare",
  "Law Enforcement",
  "Security",
  "Retail",
  "Hospitality",
  "Warehouse and Logistics",
  "Education",
  "Construction",
] as const;

export type Industry = typeof INDUSTRIES[number];

/** Whether Education/Construction are shown in public onboarding (env; default true). */
export function isEducationIndustryEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_EDUCATION_INDUSTRY !== "false";
}
export function isConstructionIndustryEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_CONSTRUCTION_INDUSTRY !== "false";
}

/** Industries to show in sign-up (filters by ENABLE_EDUCATION/CONSTRUCTION env when false). */
export function getIndustriesForSignup(): readonly Industry[] {
  return INDUSTRIES.filter(
    (i) =>
      (i !== "Education" || isEducationIndustryEnabled()) &&
      (i !== "Construction" || isConstructionIndustryEnabled())
  );
}

/** Display labels for UI (e.g. "Warehouse and Logistics" → "Warehouse & Logistics"). */
export const INDUSTRY_DISPLAY_NAMES: Record<Industry, string> = {
  Healthcare: "Healthcare",
  "Law Enforcement": "Law Enforcement",
  Security: "Security",
  Retail: "Retail",
  Hospitality: "Hospitality",
  "Warehouse and Logistics": "Warehouse & Logistics",
  Education: "Education",
  Construction: "Construction",
};

/** Map display name → onboarding route key (for sign-up redirect). */
export const INDUSTRY_TO_ONBOARDING_KEY: Partial<Record<Industry, string>> = {
  "Healthcare": "healthcare",
  "Law Enforcement": "law_enforcement",
  "Security": "security",
  "Retail": "retail",
  "Hospitality": "hospitality",
  "Warehouse and Logistics": "warehousing",
  "Education": "education",
  "Construction": "construction",
};

/** Onboarding industry keys (route params, role/setting config). */
export const ONBOARDING_KEYS = [
  'law_enforcement',
  'security',
  'hospitality',
  'retail',
  'warehousing',
  'education',
  'construction',
] as const;

export type OnboardingIndustry = typeof ONBOARDING_KEYS[number];

export const ONBOARDING_DISPLAY_NAMES: Record<OnboardingIndustry, string> = {
  law_enforcement: 'Law Enforcement',
  security: 'Security',
  hospitality: 'Hospitality',
  retail: 'Retail',
  warehousing: 'Warehousing & Logistics',
  education: 'Education',
  construction: 'Construction',
};

export const ROLE_OPTIONS: Record<OnboardingIndustry, string[]> = {
  law_enforcement: getCareersByIndustry("law_enforcement"),
  security: getCareersByIndustry("security"),
  hospitality: getCareersByIndustry("hospitality"),
  retail: getCareersByIndustry("retail"),
  warehousing: getCareersByIndustry("warehousing"),
  education: getCareersByIndustry("education"),
  construction: getCareersByIndustry("construction"),
};

export const SETTING_OPTIONS: Record<OnboardingIndustry, string[]> = {
  law_enforcement: [
    'Police Department',
    'Sheriff Office',
    'Detective Unit',
    'State Patrol',
    'Federal Agency',
    'Campus Police',
    'Transit Police'
  ],
  security: [
    'Corporate',
    'Event',
    'Residential',
    'Retail',
    'Construction Site',
    'Healthcare Facility',
    'Educational Institution'
  ],
  hospitality: [
    'Hotel',
    'Resort',
    'Restaurant',
    'Bar',
    'Event Venue',
    'Catering',
    'Cruise Ship',
    'Casino'
  ],
  retail: [
    'Grocery',
    'Clothing',
    'Electronics',
    'Big Box',
    'Pharmacy',
    'Department Store',
    'Specialty Store',
    'Online Retail'
  ],
  warehousing: [
    'Fulfillment Center',
    'Distribution Center',
    'Cold Storage',
    'Manufacturing',
    'Logistics',
    '3PL Warehouse',
    'Cross-Dock Facility'
  ],
  education: [
    'Public School',
    'Charter School',
    'Private School',
    'District Office',
    'Higher Education',
    'Early Childhood',
  ],
  construction: [
    'Residential',
    'Commercial',
    'Industrial',
    'Infrastructure',
    'Renovation',
    'General Contractor',
  ],
};
