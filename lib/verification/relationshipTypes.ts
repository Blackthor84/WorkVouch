/**
 * Verification invitation relationship types (coworkers, managers, clients, peers).
 * Used by verification request creation and respond (trust_relationship mapping).
 */

export const ALLOWED_VERIFICATION_RELATIONSHIP_TYPES = [
  "coworker",
  "manager",
  "peer",
  "client",
] as const;

export type VerificationRelationshipType = (typeof ALLOWED_VERIFICATION_RELATIONSHIP_TYPES)[number];

export type TrustRelationshipType =
  | "manager_confirmation"
  | "coworker_overlap"
  | "peer_reference";

export function parseVerificationRelationshipType(input: string | undefined): VerificationRelationshipType {
  if (typeof input === "string" && ALLOWED_VERIFICATION_RELATIONSHIP_TYPES.includes(input as VerificationRelationshipType)) {
    return input as VerificationRelationshipType;
  }
  return "coworker";
}

export function mapToTrustRelationshipType(rel: string): TrustRelationshipType {
  if (rel === "manager") return "manager_confirmation";
  if (rel === "coworker") return "coworker_overlap";
  return "peer_reference";
}
