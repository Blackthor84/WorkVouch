import { admin } from "@/lib/supabase-admin";
import { getUserPlan, isFreePlan, type ProfilePlan } from "@/lib/auth/plan";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";

export type EmployerAccessMode = "free_preview" | "full";

export type EmployerAccessResult =
  | { mode: "free_preview"; plan: ProfilePlan }
  | { mode: "full"; plan: ProfilePlan; subscription: Awaited<ReturnType<typeof requireActiveSubscription>> };

export type ResolveEmployerDataAccessResult =
  | { ok: false; status: number; error: string }
  | ({ ok: true } & EmployerAccessResult);

/**
 * Employers on profiles.plan = free may use preview APIs without Stripe subscription.
 * Pro/enterprise require existing subscription rules.
 */
export async function resolveEmployerDataAccess(userId: string): Promise<ResolveEmployerDataAccessResult> {
  const { data: row, error } = await admin.from("profiles").select("role, plan").eq("id", userId).maybeSingle();
  if (error) {
    return { ok: false, status: 500, error: error.message };
  }
  const role = String((row as { role?: string } | null)?.role ?? "").toLowerCase();
  if (role !== "employer") {
    return { ok: false, status: 403, error: "Employer access required" };
  }

  const plan = getUserPlan(row as { plan?: string | null });

  if (isFreePlan({ plan })) {
    return { ok: true, mode: "free_preview", plan };
  }

  const subscription = await requireActiveSubscription(userId);
  if (!subscription.allowed) {
    return {
      ok: false,
      status: 403,
      error: subscription.error ?? "Active subscription required.",
    };
  }

  return { ok: true, mode: "full", plan, subscription };
}
