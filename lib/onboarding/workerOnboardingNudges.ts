import { addHours } from "date-fns";

/**
 * In-app onboarding nudges for employees who haven’t finished the vouch loop.
 * Timing mirrors: 1h, 24h, 48h after profile signup — skip entirely if they’ve sent an invite.
 */

export type OnboardingReminderKind = "1h" | "24h" | "48h";

export const ONBOARDING_NUDGE_MESSAGES: Record<
  OnboardingReminderKind,
  { title: string; message: string }
> = {
  "1h": {
    title: "One vouch away",
    message: "You're 1 vouch away from standing out — add someone you worked with",
  },
  "24h": {
    title: "Don't fall behind",
    // Privacy-safe: no city/state (see workvouch-location-safety)
    message: "People on WorkVouch are getting verified — don't fall behind",
  },
  "48h": {
    title: "First vouch",
    message: "Want help getting your first vouch? I got you",
  },
};

/** When a queued reminder should run (ISO), from profile.created_at. */
export function reminderRunAfterISO(createdAt: Date, kind: OnboardingReminderKind): string {
  switch (kind) {
    case "1h":
      return addHours(createdAt, 1).toISOString();
    case "24h":
      return addHours(createdAt, 24).toISOString();
    case "48h":
      return addHours(createdAt, 48).toISOString();
    default:
      return addHours(createdAt, 24).toISOString();
  }
}

export function onboardingReminderRows(userId: string, profileCreatedAt: string | null) {
  const base = profileCreatedAt ? new Date(profileCreatedAt) : new Date();
  const kinds: OnboardingReminderKind[] = ["1h", "24h", "48h"];
  return kinds.map((reminder_kind) => ({
    user_id: userId,
    reminder_kind,
    run_after: reminderRunAfterISO(base, reminder_kind),
  }));
}

/**
 * Pseudocode-style guard: if they’ve already sent a coworker invite, no nudge.
 * (Still mark queue rows processed so cron doesn’t retry forever.)
 */
export function shouldSkipOnboardingNudge(hasInvite: boolean): boolean {
  return hasInvite;
}
