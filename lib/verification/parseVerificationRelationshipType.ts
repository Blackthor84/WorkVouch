export type VerificationRelationshipType =
  | "manager"
  | "coworker"
  | "client"
  | "direct_report"
  | "vendor";

export function parseVerificationRelationshipType(
  value: unknown
): VerificationRelationshipType | null {
  if (typeof value !== "string") return null;

  const normalized = value.toLowerCase();

  const allowed: VerificationRelationshipType[] = [
    "manager",
    "coworker",
    "client",
    "direct_report",
    "vendor",
  ];

  if (allowed.includes(normalized as VerificationRelationshipType)) {
    return normalized as VerificationRelationshipType;
  }

  return null;
}

