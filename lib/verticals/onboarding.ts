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
  },

  Healthcare: {
    industry: "Healthcare",
    employeeFields: [
      { key: "license_type", label: "License Type", type: "text" },
      { key: "years_practice", label: "Years Practicing", type: "number" },
      { key: "specialty", label: "Specialty", type: "text" },
    ],
  },

  "Law Enforcement": {
    industry: "Law Enforcement",
    employeeFields: [
      { key: "years_service", label: "Years of Service", type: "number" },
      { key: "department_type", label: "Department Type", type: "text" },
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
  },
};

/** Get onboarding config for an industry. Returns null if industry has no vertical config. */
export function getVerticalOnboardingConfig(
  industry: string | null | undefined
): VerticalOnboardingConfig | null {
  if (!industry) return null;
  return verticalOnboarding[industry] ?? null;
}
