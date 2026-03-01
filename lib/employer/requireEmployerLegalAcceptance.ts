/**
 * Backend enforcement: employer legal disclaimer acceptance.
 * Employers must have a row in employer_legal_acceptance(profile_id, version, accepted_at)
 * for the current disclaimer version before accessing candidate search / profile view.
 * Admin and superadmin are not blocked.
 */

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";

/** Current employer disclaimer version. Bump when terms change and re-acceptance is required. */
export const EMPLOYER_DISCLAIMER_VERSION = "1";

export const EMPLOYER_DISCLAIMER_NOT_ACCEPTED = "EMPLOYER_DISCLAIMER_NOT_ACCEPTED" as const;

export type RequireEmployerLegalAcceptanceResult =
  | { allowed: true }
  | { allowed: false; reasonCode: typeof EMPLOYER_DISCLAIMER_NOT_ACCEPTED };

/**
 * Returns true if the user is admin or superadmin (any casing). They are not required to accept.
 */
function isAdminOrSuperadmin(role: string | null | undefined): boolean {
  if (!role || typeof role !== "string") return false;
  const r = role.toLowerCase();
  return r === "admin" || r === "superadmin" || r === "super_admin";
}

/**
 * Check if the user has accepted the current employer legal disclaimer.
 * - Admin and superadmin always pass.
 * - Otherwise requires a row in employer_legal_acceptance for profile_id and current version.
 *
 * @param profileId - profiles.id (same as effective user id in this codebase)
 * @param role - Optional profile.role; if not provided, not used (guard will still query acceptance).
 */
export async function requireEmployerLegalAcceptance(
  profileId: string,
  role?: string | null
): Promise<RequireEmployerLegalAcceptanceResult> {
  if (isAdminOrSuperadmin(role)) {
    return { allowed: true };
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("employer_legal_acceptance")
    .select("profile_id")
    .eq("profile_id", profileId)
    .eq("version", EMPLOYER_DISCLAIMER_VERSION)
    .maybeSingle();

  if (error) {
    console.error("[requireEmployerLegalAcceptance]", error);
    return { allowed: false, reasonCode: EMPLOYER_DISCLAIMER_NOT_ACCEPTED };
  }

  if (!data) {
    return { allowed: false, reasonCode: EMPLOYER_DISCLAIMER_NOT_ACCEPTED };
  }

  return { allowed: true };
}

/**
 * For API route handlers: returns a 403 NextResponse if disclaimer not accepted, otherwise null.
 * Call after auth and employer check; use getCurrentUser() and getCurrentUserRole() for ids.
 */
export async function requireEmployerLegalAcceptanceOrResponse(
  profileId: string,
  role?: string | null
): Promise<NextResponse | null> {
  const result = await requireEmployerLegalAcceptance(profileId, role);
  if (result.allowed) return null;
  return NextResponse.json(
    {
      error: "Employer legal disclaimer must be accepted before using this feature.",
      code: result.reasonCode,
    },
    { status: 403 }
  );
}
