/**
 * Industry-specific profile fields configuration
 */

export type Industry = 'law_enforcement' | 'security' | 'hospitality' | 'retail' | 'warehousing'

export interface IndustryField {
  field_type: string
  field_name: string
  placeholder?: string
  required?: boolean
  options?: string[]
}

export const INDUSTRY_FIELDS: Record<Industry, IndustryField[]> = {
  law_enforcement: [
    {
      field_type: 'certification',
      field_name: 'Certifications',
      placeholder: 'e.g., POST Certified, CPR, First Aid',
    },
    {
      field_type: 'clearance',
      field_name: 'Security Clearance Level',
      placeholder: 'e.g., Secret, Top Secret',
      options: ['None', 'Confidential', 'Secret', 'Top Secret'],
    },
    {
      field_type: 'experience',
      field_name: 'Years of Service',
      placeholder: 'Total years in law enforcement',
    },
    {
      field_type: 'specialty',
      field_name: 'Specialty Areas',
      placeholder: 'e.g., Patrol, Investigations, SWAT',
    },
  ],
  security: [
    {
      field_type: 'certification',
      field_name: 'Security Certifications',
      placeholder: 'e.g., Guard Card, CPR, First Aid',
    },
    {
      field_type: 'clearance',
      field_name: 'Security Clearance',
      placeholder: 'e.g., Level 1, Level 2, Secret',
      options: ['None', 'Level 1', 'Level 2', 'Secret', 'Top Secret'],
    },
    {
      field_type: 'experience',
      field_name: 'Security Experience',
      placeholder: 'Years in security field',
    },
    {
      field_type: 'specialty',
      field_name: 'Security Specialties',
      placeholder: 'e.g., Corporate, Event, Retail, Loss Prevention',
    },
  ],
  hospitality: [
    {
      field_type: 'skill',
      field_name: 'Guest Service Skills',
      placeholder: 'e.g., Front desk, Concierge, Guest relations',
    },
    {
      field_type: 'experience',
      field_name: 'Front Desk Experience',
      placeholder: 'Years of front desk experience',
    },
    {
      field_type: 'experience',
      field_name: 'Housekeeping Experience',
      placeholder: 'Years of housekeeping experience',
    },
    {
      field_type: 'certification',
      field_name: 'Hospitality Certifications',
      placeholder: 'e.g., ServSafe, TIPS, Hotel Management',
    },
  ],
  retail: [
    {
      field_type: 'skill',
      field_name: 'Customer Service Rating',
      placeholder: 'e.g., Excellent, Good, Average',
      options: ['Excellent', 'Good', 'Average'],
    },
    {
      field_type: 'experience',
      field_name: 'POS Experience',
      placeholder: 'Years of POS system experience',
    },
    {
      field_type: 'skill',
      field_name: 'Retail Skills',
      placeholder: 'e.g., Sales, Inventory, Visual Merchandising',
    },
    {
      field_type: 'experience',
      field_name: 'Retail Experience',
      placeholder: 'Total years in retail',
    },
  ],
  warehousing: [
    {
      field_type: 'warehouse_type',
      field_name: 'Warehouse Type',
      placeholder: 'Select warehouse type',
      options: ['Fulfillment Center', 'Distribution Center', 'Cross-Dock Facility', 'Cold Storage', 'Manufacturing Warehouse', 'Mixed / Not Sure'],
    },
    {
      field_type: 'equipment',
      field_name: 'Equipment Operated',
      placeholder: 'Select equipment you have operated',
      options: ['Forklift (certified)', 'Forklift (not certified)', 'Pallet Jack (manual)', 'Electric Pallet Jack', 'Reach Truck', 'Order Picker', 'None'],
    },
    {
      field_type: 'responsibility',
      field_name: 'Responsibilities',
      placeholder: 'Select your responsibilities',
      options: ['Picking', 'Packing', 'Shipping', 'Receiving', 'Inventory', 'Labeling', 'Loading', 'Unloading', 'Quality Check', 'RF Scanner', 'Safety Checks'],
    },
    {
      field_type: 'certification',
      field_name: 'Certifications',
      placeholder: 'Select your certifications',
      options: ['Forklift Certification', 'OSHA 10', 'OSHA 30', 'First Aid / CPR', 'None'],
    },
  ],
}

export function getIndustryFields(industry: Industry): IndustryField[] {
  return INDUSTRY_FIELDS[industry] || []
}

export function getIndustryDisplayName(industry: Industry): string {
  const names: Record<Industry, string> = {
    law_enforcement: 'Law Enforcement',
    security: 'Security',
    hospitality: 'Hospitality',
    retail: 'Retail',
    warehousing: 'Warehousing & Logistics',
  }
  return names[industry] || industry
}

// Warehouse-specific skills
export const WAREHOUSE_SKILLS = {
  core: [
    'Picking & Packing',
    'Pallet Building',
    'Inventory Management',
    'Cycle Counting',
    'Shipping & Receiving',
    'RF Scanner Operation',
    'Loading & Unloading',
    'Quality Inspection',
    'Packing Station Setup',
    'Line Work',
    'Box Assembly',
    'Labeling',
  ],
  equipment: [
    'Forklift Operation',
    'Reach Truck',
    'Order Picker',
    'Electric Pallet Jack',
    'Manual Pallet Jack',
    'Dock Leveler Operation',
  ],
  safety: [
    'OSHA Safety Compliance',
    'PPE Usage',
    'Warehouse Safety Procedures',
    'Hazard Spotting',
    'Emergency Response Support',
  ],
}

// Warehouse job title presets
export const WAREHOUSE_JOB_TITLES = [
  'Warehouse Associate',
  'Material Handler',
  'Picker / Packer',
  'Fulfillment Associate',
  'Forklift Operator',
  'Reach Truck Operator',
  'Inventory Specialist',
  'Shipping Clerk',
  'Receiving Clerk',
  'Dock Worker',
  'Logistic Support Associate',
  'Warehouse Lead',
  'Team Trainer',
]

// Get all warehouse skills as a flat array
export function getAllWarehouseSkills(): string[] {
  return [
    ...WAREHOUSE_SKILLS.core,
    ...WAREHOUSE_SKILLS.equipment,
    ...WAREHOUSE_SKILLS.safety,
  ]
}
