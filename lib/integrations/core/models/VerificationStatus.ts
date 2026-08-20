/** WorkVouch verification status attached to ATS candidate events. */
export type VerificationStatus =
  | "not_invited"
  | "invitation_sent"
  | "in_progress"
  | "verified"
  | "failed"
  | "unknown";

export const VERIFICATION_STATUSES: VerificationStatus[] = [
  "not_invited",
  "invitation_sent",
  "in_progress",
  "verified",
  "failed",
  "unknown",
];
