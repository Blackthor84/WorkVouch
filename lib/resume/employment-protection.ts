/**
 * Verified employment protection — resume claims cannot downgrade verified records.
 */

export type EmploymentVerificationStatus = "pending" | "verified" | string;

export type EmploymentConfirmAction = "create" | "skip" | "update";

export type ResolvedEmploymentAction = {
  action: EmploymentConfirmAction;
  verified_protected: boolean;
  reason: string | null;
};

/** Verified records are never modified or downgraded by resume import. */
export function resolveEmploymentConfirmAction(
  requested: EmploymentConfirmAction,
  existingVerificationStatus: EmploymentVerificationStatus | null | undefined
): ResolvedEmploymentAction {
  if (requested === "update" && existingVerificationStatus === "verified") {
    return {
      action: "skip",
      verified_protected: true,
      reason: "Verified employment cannot be changed by a resume import.",
    };
  }
  return { action: requested, verified_protected: false, reason: null };
}

export function isVerifiedEmployment(status: EmploymentVerificationStatus | null | undefined): boolean {
  return status === "verified";
}

/** UI: hide update option when duplicate target is verified */
export function allowedDuplicateActions(
  verificationStatus: EmploymentVerificationStatus | null | undefined
): EmploymentConfirmAction[] {
  if (isVerifiedEmployment(verificationStatus)) {
    return ["skip", "create"];
  }
  return ["skip", "update", "create"];
}
