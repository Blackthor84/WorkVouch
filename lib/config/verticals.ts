/**
 * Vertical feature flags: display names for enabled verticals.
 * Used by sandbox ControlPanel and other UI to show/hide vertical onboarding.
 */

export const ENABLED_VERTICALS = [
  "Healthcare",
  "Law Enforcement",
  "Security",
  "Retail",
  "Hospitality",
  "Warehouse and Logistics",
  "Education",
  "Construction",
];

export function industryToVerticalName(industry: string): string {
  return industry?.trim() ?? "";
}
