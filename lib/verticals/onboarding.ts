/**
 * Vertical-specific onboarding field config.
 * Rendered dynamically in onboarding forms; data persisted in profiles.vertical_metadata (JSONB).
 * Does not modify scoring.
 */

export type VerticalOnboardingField = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "multi-select";
  required?: boolean;
  options?: string[];
};

export type VerticalOnboardingConfig = {
  industry: string;
  employeeFields: VerticalOnboardingField[];
  employerFields?: VerticalOnboardingField[];
};

export const verticalOnboarding: Record<string, VerticalOnboardingConfig> = {
  Education: {
    industry: "Education",
    employeeFields: [
      { key: "years_teaching", label: "Years Teaching", type: "number", required: true },
      {
        key: "grade_levels",
        label: "Grade Levels",
        type: "multi-select",
        options: ["K-5", "6-8", "9-12", "College"],
      },
      {
        key: "subjects",
        label: "Subjects",
        type: "multi-select",
        options: ["Math", "Science", "English", "History", "Special Education"],
      },
    ],
    employerFields: [
      {
        key: "roles_hiring",
        label: "Roles you hire most",
        type: "multi-select",
        options: ["Teachers", "Administrators", "Support staff", "Substitutes"],
        required: true,
      },
      {
        key: "monthly_hires",
        label: "Typical monthly hiring volume",
        type: "select",
        options: ["1-5", "6-20", "21+"],
        required: true,
      },
    ],
  },

  Construction: {
    industry: "Construction",
    employeeFields: [
      { key: "trade_specialty", label: "Trade Specialty", type: "text" },
      {
        key: "osha_certified",
        label: "OSHA Certified",
        type: "select",
        options: ["Yes", "No"],
      },
      { key: "years_experience", label: "Years Experience", type: "number" },
    ],
    employerFields: [
      {
        key: "roles_hiring",
        label: "Trades you hire for",
        type: "multi-select",
        options: ["General labor", "Electrician", "Plumbing", "HVAC", "Carpentry"],
        required: true,
      },
      {
        key: "monthly_hires",
        label: "Typical monthly hiring volume",
        type: "select",
        options: ["1-5", "6-20", "21+"],
        required: true,
      },
    ],
  },

  Security: {
    industry: "Security",
    employeeFields: [
      {
        key: "armed_status",
        label: "Armed Certified",
        type: "select",
        options: ["Yes", "No"],
      },
      { key: "license_number", label: "License Number", type: "text" },
      { key: "years_experience", label: "Years Experience", type: "number" },
    ],
    employerFields: [
      {
        key: "armed_guards_needed",
        label: "Do you hire armed guards?",
        type: "select",
        options: ["Yes", "No", "Sometimes"],
        required: true,
      },
      {
        key: "monthly_hires",
        label: "Typical monthly hiring volume",
        type: "select",
        options: ["1-5", "6-20", "21+"],
        required: true,
      },
    ],
  },

  Healthcare: {
    industry: "Healthcare",
    employeeFields: [
      { key: "license_type", label: "License Type", type: "text" },
      { key: "years_practice", label: "Years Practicing", type: "number" },
      { key: "specialty", label: "Specialty", type: "text" },
    ],
    employerFields: [
      {
        key: "roles_hiring",
        label: "Clinical roles you hire",
        type: "multi-select",
        options: ["RN", "LPN", "CNA", "Allied health", "Administrative"],
        required: true,
      },
      {
        key: "monthly_hires",
        label: "Typical monthly hiring volume",
        type: "select",
        options: ["1-5", "6-20", "21+"],
        required: true,
      },
    ],
  },

  "Law Enforcement": {
    industry: "Law Enforcement",
    employeeFields: [
      { key: "years_service", label: "Years of Service", type: "number" },
      { key: "department_type", label: "Department Type", type: "text" },
    ],
    employerFields: [
      {
        key: "roles_hiring",
        label: "Roles you hire",
        type: "multi-select",
        options: ["Officers", "Dispatch", "Administrative", "Support"],
        required: true,
      },
      {
        key: "monthly_hires",
        label: "Typical monthly hiring volume",
        type: "select",
        options: ["1-5", "6-20", "21+"],
        required: true,
      },
    ],
  },

  Retail: {
    industry: "Retail",
    employeeFields: [
      {
        key: "customer_facing",
        label: "Customer Facing Role",
        type: "select",
        options: ["Yes", "No"],
      },
      { key: "years_experience", label: "Years Experience", type: "number" },
    ],
    employerFields: [
      {
        key: "roles_hiring",
        label: "Roles you hire most",
        type: "multi-select",
        options: ["Sales floor", "Management", "Warehouse/backroom", "Seasonal"],
        required: true,
      },
      {
        key: "monthly_hires",
        label: "Typical monthly hiring volume",
        type: "select",
        options: ["1-5", "6-20", "21+"],
        required: true,
      },
    ],
  },

  Hospitality: {
    industry: "Hospitality",
    employeeFields: [
      {
        key: "front_of_house",
        label: "Front of House",
        type: "select",
        options: ["Yes", "No"],
      },
      { key: "years_experience", label: "Years Experience", type: "number" },
    ],
    employerFields: [
      {
        key: "roles_hiring",
        label: "Roles you hire most",
        type: "multi-select",
        options: ["Front of house", "Kitchen", "Management", "Housekeeping"],
        required: true,
      },
      {
        key: "monthly_hires",
        label: "Typical monthly hiring volume",
        type: "select",
        options: ["1-5", "6-20", "21+"],
        required: true,
      },
    ],
  },

  "Warehouse and Logistics": {
    industry: "Warehouse and Logistics",
    employeeFields: [
      {
        key: "forklift_certified",
        label: "Forklift Certified",
        type: "select",
        options: ["Yes", "No"],
      },
      { key: "shift_type", label: "Shift Type", type: "text" },
    ],
    employerFields: [
      {
        key: "roles_hiring",
        label: "Roles you hire most",
        type: "multi-select",
        options: ["Picker/packer", "Forklift operator", "Supervisor", "Driver"],
        required: true,
      },
      {
        key: "monthly_hires",
        label: "Typical monthly hiring volume",
        type: "select",
        options: ["1-5", "6-20", "21+"],
        required: true,
      },
    ],
  },
};

/** Get onboarding config for an industry. Returns null if industry has no vertical config. */
export function normalizeIndustryKey(industry: string | null | undefined): string | null {
  if (!industry?.trim()) return null;
  const r = industry.trim().toLowerCase();
  const aliases: Record<string, string> = {
    warehousing: "Warehouse and Logistics",
    warehouse: "Warehouse and Logistics",
    healthcare: "Healthcare",
    trades: "Construction",
    construction: "Construction",
    hospitality: "Hospitality",
    security: "Security",
    retail: "Retail",
  };
  if (aliases[r]) return aliases[r];
  return industry.trim();
}

export function getVerticalOnboardingConfig(
  industry: string | null | undefined
): VerticalOnboardingConfig | null {
  const normalized = normalizeIndustryKey(industry);
  if (!normalized) return null;
  return verticalOnboarding[normalized] ?? null;
}
