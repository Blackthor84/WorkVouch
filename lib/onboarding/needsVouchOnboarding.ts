import { admin } from "@/lib/supabase-admin";

/**
 * Employees must complete the vouch onboarding loop before the rest of the app (except /onboarding).
 */
export async function needsWorkerVouchOnboarding(userId: string): Promise<boolean> {
  const { data: row, error } = await admin
    .from("profiles")
    .select("role, worker_onboarding_loop_completed_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !row) return false;

  const role = String((row as { role?: string | null }).role ?? "").toLowerCase();
  /** Only employees complete the worker vouch loop; employers/admins use other flows. */
  if (role !== "employee") return false;

  const done = (row as { worker_onboarding_loop_completed_at?: string | null }).worker_onboarding_loop_completed_at;
  return !done;
}
