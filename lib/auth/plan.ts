export type ProfilePlan = "free" | "pro" | "enterprise";

const PAID: ProfilePlan[] = ["pro", "enterprise"];

export function normalizePlan(raw: string | null | undefined): ProfilePlan {
  const p = String(raw ?? "free").trim().toLowerCase();
  if (p === "pro") return "pro";
  if (p === "enterprise") return "enterprise";
  return "free";
}

/** `user` is any object with optional `plan` (e.g. profiles row). */
export function getUserPlan(user: { plan?: string | null } | null | undefined): ProfilePlan {
  return normalizePlan(user?.plan);
}

export function isFreePlan(user: { plan?: string | null } | null | undefined): boolean {
  return getUserPlan(user) === "free";
}

export function isPaidPlan(user: { plan?: string | null } | null | undefined): boolean {
  return PAID.includes(getUserPlan(user));
}
