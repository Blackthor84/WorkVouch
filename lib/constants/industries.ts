/**
 * Industry configuration for onboarding and shared dropdowns.
 * INDUSTRIES_OPTIONS: display names for dropdowns and API validation (sandbox + production).
 * INDUSTRIES + Industry: onboarding route keys and role/setting config.
 */

/** Shared industry options for dropdowns and API validation (display names). */
export const INDUSTRIES_OPTIONS = [
  "Healthcare",
  "Law Enforcement",
  "Security",
  "Retail",
  "Hospitality",
  "Warehouse and Logistics",
  "Education",
  "Construction",
] as const;

export type IndustryOption = typeof INDUSTRIES_OPTIONS[number];

/** Onboarding industry keys (route params, role/setting config). */
export const INDUSTRIES = [
  'law_enforcement',
  'security',
  'hospitality',
  'retail',
  'warehousing'
] as const

export type Industry = typeof INDUSTRIES[number]

export const INDUSTRY_DISPLAY_NAMES: Record<Industry, string> = {
  law_enforcement: 'Law Enforcement',
  security: 'Security',
  hospitality: 'Hospitality',
  retail: 'Retail',
  warehousing: 'Warehousing & Logistics'
}

export const ROLE_OPTIONS: Record<Industry, string[]> = {
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

export const SETTING_OPTIONS: Record<Industry, string[]> = {
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
