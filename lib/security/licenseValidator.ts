/**
 * State-by-state license format validation for Security Agency plan.
 * Only used when employer plan_tier === "security_agency".
 */

export type ValidationResult = { valid: boolean; error?: string };

/** NY: common patterns e.g. 1234567 or 7 digits */
const NY_REGEX = /^[A-Z0-9]{5,12}$/i;
/** CA: e.g. 123456 or 6-8 alphanumeric */
const CA_REGEX = /^[A-Z0-9]{6,10}$/i;
/** TX: e.g. 12345678 or 8 digits */
const TX_REGEX = /^[A-Z0-9]{6,12}$/i;
/** Generic: alphanumeric, reasonable length */
const GENERIC_REGEX = /^[A-Z0-9\-]{4,20}$/i;

/**
 * Validate license number format by state.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export function validateLicenseFormat(
  state: string,
  licenseNumber: string
): ValidationResult {
  const trimmed = (licenseNumber ?? "").trim();
  if (!trimmed) {
    return { valid: false, error: "License number is required" };
  }

  const stateUpper = (state ?? "").trim().toUpperCase();

  switch (stateUpper) {
    case "NY":
      return NY_REGEX.test(trimmed)
        ? { valid: true }
        : { valid: false, error: "Invalid NY license format (expected 5–12 alphanumeric)" };
    case "CA":
      return CA_REGEX.test(trimmed)
        ? { valid: true }
        : { valid: false, error: "Invalid CA license format (expected 6–10 alphanumeric)" };
    case "TX":
      return TX_REGEX.test(trimmed)
        ? { valid: true }
        : { valid: false, error: "Invalid TX license format (expected 6–12 alphanumeric)" };
    default:
      return GENERIC_REGEX.test(trimmed)
        ? { valid: true }
        : { valid: false, error: "Invalid license format (expected 4–20 alphanumeric)" };
  }
}
