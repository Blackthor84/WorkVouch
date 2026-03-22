/**
 * Mobile-first vouch onboarding loop (employee): job → coworkers → invite → confirm.
 */

export const VOUCH_ONBOARDING_STEPS = 5;

export type VouchTier = 0 | 1 | 2 | 3;

/** Canonical slug from vouch count (matches `profiles.vouch_tier` bands from SQL). */
export type VouchStatusSlug = "no_vouch" | "starter" | "verified" | "trusted";

/** @deprecated use VouchStatusSlug */
export type VouchTierLabel = VouchStatusSlug;

/**
 * Status from raw vouch count (accepted invites sent by user, etc.).
 * 5+ trusted, 2–4 verified, 1 starter, 0 no_vouch.
 */
export function getStatus(vouches: number): VouchStatusSlug {
  if (vouches >= 5) return "trusted";
  if (vouches >= 2) return "verified";
  if (vouches >= 1) return "starter";
  return "no_vouch";
}

/** Numeric tier 0–3 stored on `profiles.vouch_tier` (kept in sync with count in SQL). */
export function vouchTierFromCount(count: number): VouchTier {
  if (count >= 5) return 3;
  if (count >= 2) return 2;
  if (count >= 1) return 1;
  return 0;
}

/**
 * Fields to write on `profiles` after a vouch count change (mirrors `refresh_user_vouch_stats`).
 * Prefer calling `admin.rpc("refresh_user_vouch_stats", { p_user_id })` in API routes so counts stay
 * tied to `coworker_invites`; use this when building a patch in app code only.
 */
export function vouchProfileFieldsFromCount(count: number): {
  vouch_count: number;
  vouch_tier: VouchTier;
  vouch_status: VouchStatusSlug;
} {
  return {
    vouch_count: count,
    vouch_tier: vouchTierFromCount(count),
    vouch_status: getStatus(count),
  };
}

/** Map DB `vouch_tier` smallint (0–3) to the same slugs as `getStatus`. */
export function vouchStatusFromTier(tier: number): VouchStatusSlug {
  if (tier >= 3) return "trusted";
  if (tier === 2) return "verified";
  if (tier === 1) return "starter";
  return "no_vouch";
}

export function vouchTierLabel(tier: number): VouchStatusSlug {
  return vouchStatusFromTier(tier);
}

export function vouchStatusDisplayName(status: VouchStatusSlug): string {
  switch (status) {
    case "trusted":
      return "Trusted";
    case "verified":
      return "Verified";
    case "starter":
      return "Starter";
    case "no_vouch":
    default:
      return "No vouch";
  }
}

/** UI label from stored `profiles.vouch_tier`. */
export function vouchTierDisplayName(tier: number): string {
  return vouchStatusDisplayName(vouchStatusFromTier(tier));
}

/** UI label from vouch count (when you have count, not only tier). */
export function vouchCountDisplayName(vouches: number): string {
  return vouchStatusDisplayName(getStatus(vouches));
}

export type VouchOnboardingStatePayload = {
  step: number;
  hasJob: boolean;
  job: { id: string; company_name: string; job_title: string | null } | null;
  contacts: Array<{
    position: number;
    display_name: string;
    email: string | null;
    phone: string | null;
    inviteSent: boolean;
  }>;
  invitesSentCount: number;
  vouchCount: number;
  vouchTier: number;
  completed: boolean;
  /** User may finish wizard if job exists and (≥1 contact saved OR ≥1 invite sent). */
  canComplete: boolean;
  /** At least one contact has invite created (send step done). */
  sendStepDone: boolean;
};
