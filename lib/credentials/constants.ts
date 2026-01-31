/**
 * Flexible credential types for role-specific display.
 * Add new types without schema changes — store as credential_type in professional_credentials.
 */

export const CREDENTIAL_TYPES = {
  guard_license: "Guard License",
  rn_license: "RN License",
  medical_license: "Medical License",
  osha_cert: "OSHA Certification",
  aws_cert: "AWS Certification",
  tech_cert: "Tech Certification",
  cdl: "Commercial Driver License",
  trade_cert: "Trade Certification",
  training_renewal: "Training Renewal",
  other: "Other",
} as const;

export type CredentialTypeKey = keyof typeof CREDENTIAL_TYPES;

/** Role → suggested credential_type for display labels */
export const ROLE_CREDENTIAL_TYPES: Record<string, CredentialTypeKey> = {
  security: "guard_license",
  healthcare: "medical_license",
  it: "tech_cert",
  construction: "trade_cert",
};

export function getCredentialTypeLabel(type: string): string {
  return CREDENTIAL_TYPES[type as CredentialTypeKey] ?? type;
}
