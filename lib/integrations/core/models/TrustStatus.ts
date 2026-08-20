/** WorkVouch trust status attached to ATS candidate events. */
export type TrustStatus =
  | "not_linked"
  | "linked"
  | "score_pending"
  | "score_available"
  | "unknown";

export const TRUST_STATUSES: TrustStatus[] = [
  "not_linked",
  "linked",
  "score_pending",
  "score_available",
  "unknown",
];
