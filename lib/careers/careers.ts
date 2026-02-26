/**
 * Single source of truth for WorkVouch career / job title options.
 * Used in production onboarding (worker + employer) and Enterprise Playground.
 * No mock data; no duplication.
 */

const CAREERS_BY_INDUSTRY: Record<string, string[]> = {
  healthcare: [
    "CNA",
    "RN",
    "LPN",
    "HHA",
    "Medical Assistant",
    "Patient Care Tech",
    "Dental Assistant",
    "Medical Receptionist",
    "Phlebotomist",
    "Pharmacy Technician",
    "ER Tech",
    "Caregiver",
    "Lab Assistant",
    "Sterile Processing Tech",
  ],
  law_enforcement: [
    "Officer",
    "Detective",
    "Dispatcher",
    "K9 Handler",
    "Investigator",
    "Sergeant",
    "Lieutenant",
    "Captain",
    "Crime Scene Investigator (CSI)",
    "SWAT Team Member",
    "Community Policing Officer",
    "Traffic Enforcement Officer",
    "Jail/Correctional Officer",
    "Records/Administration Officer",
    "Forensic Analyst",
  ],
  security: [
    "Guard",
    "Loss Prevention",
    "Event Security",
    "Patrol Officer",
    "Security Supervisor",
  ],
  hospitality: [
    "Front Desk",
    "Housekeeping",
    "Food & Beverage",
    "Concierge",
    "Event Staff",
  ],
  retail: [
    "Cashier",
    "Sales Associate",
    "Stock Clerk",
    "Supervisor",
    "Store Manager",
  ],
  warehousing: [
    "Picker/Packer",
    "Forklift Operator",
    "Loader",
    "Warehouse Clerk",
    "Supervisor",
    "Inventory Control Specialist",
    "Shipping & Receiving Clerk",
    "Material Handler",
    "Quality Control Inspector",
    "Order Fulfillment Associate",
    "Logistics Coordinator",
    "Warehouse Technician",
    "Logistics Planner",
    "Dispatch Coordinator",
    "Transportation Manager",
    "Route Planner",
    "Supply Chain Analyst",
    "Fleet Supervisor",
    "Shipping Coordinator",
    "Freight Handler",
    "Inventory Planner",
  ],
  education: [
    "Teacher",
    "Substitute Teacher",
    "Paraprofessional",
    "School Counselor",
    "Administrator",
    "Principal",
    "Librarian",
    "Special Education",
    "ESL Teacher",
    "Coach",
  ],
  construction: [
    "Laborer",
    "Carpenter",
    "Electrician",
    "Plumber",
    "HVAC",
    "Welder",
    "Foreman",
    "Supervisor",
    "Project Manager",
    "Equipment Operator",
  ],
};

const _flat = Object.values(CAREERS_BY_INDUSTRY).flat();
export const WORKVOUCH_CAREERS: readonly string[] = [...new Set(_flat)].sort((a, b) => a.localeCompare(b, "en"));

export type WorkVouchCareer = (typeof WORKVOUCH_CAREERS)[number];

export function getCareersByIndustry(industry: string): string[] {
  return CAREERS_BY_INDUSTRY[industry] ?? [];
}
