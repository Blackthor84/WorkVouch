/**
 * Single source of truth for industry.
 * INDUSTRIES: display names for dropdowns, API validation, sandbox + production.
 * ONBOARDING_KEYS + Industry (key type): onboarding route params and role/setting config.
 */

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
};

/** Onboarding industry keys (route params, role/setting config). */
export const ONBOARDING_KEYS = [
  'law_enforcement',
  'security',
  'hospitality',
  'retail',
  'warehousing'
] as const;

export type OnboardingIndustry = typeof ONBOARDING_KEYS[number];

export const ONBOARDING_DISPLAY_NAMES: Record<OnboardingIndustry, string> = {
  law_enforcement: 'Law Enforcement',
  security: 'Security',
  hospitality: 'Hospitality',
  retail: 'Retail',
  warehousing: 'Warehousing & Logistics'
}

export const ROLE_OPTIONS: Record<OnboardingIndustry, string[]> = {
  law_enforcement: [
    'Officer',
    'Detective',
    'Dispatcher',
    'K9 Handler',
    'Investigator',
    'Sergeant',
    'Lieutenant',
    'Captain',
    'Crime Scene Investigator (CSI)',
    'SWAT Team Member',
    'Community Policing Officer',
    'Traffic Enforcement Officer',
    'Jail/Correctional Officer',
    'Records/Administration Officer',
    'Forensic Analyst'
  ],
  security: [
    'Guard',
    'Loss Prevention',
    'Event Security',
    'Patrol Officer',
    'Security Supervisor'
  ],
  hospitality: [
    'Front Desk',
    'Housekeeping',
    'Food & Beverage',
    'Concierge',
    'Event Staff'
  ],
  retail: [
    'Cashier',
    'Sales Associate',
    'Stock Clerk',
    'Supervisor',
    'Store Manager'
  ],
  warehousing: [
    'Picker/Packer',
    'Forklift Operator',
    'Loader',
    'Warehouse Clerk',
    'Supervisor',
    'Inventory Control Specialist',
    'Shipping & Receiving Clerk',
    'Material Handler',
    'Quality Control Inspector',
    'Order Fulfillment Associate',
    'Logistics Coordinator',
    'Warehouse Technician'
  ]
}

// Additional roles for Logistics (can be used as a sub-industry or separate)
export const LOGISTICS_ROLES = [
  'Logistics Planner',
  'Dispatch Coordinator',
  'Transportation Manager',
  'Route Planner',
  'Supply Chain Analyst',
  'Fleet Supervisor',
  'Shipping Coordinator',
  'Freight Handler',
  'Inventory Planner'
]

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
  ]
}
