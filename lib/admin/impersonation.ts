/**
 * Start impersonation: validate target profile and set acting_user cookie.
 * Used by POST /api/admin/impersonate.
 */
import { getSupabaseServer } from "@/lib/supabase/admin";
import { setActingUserCookie } from "@/lib/auth/actingUser";

export type StartImpersonationParams = {
  authUserId: string;
  actingUserId: string;
};

export async function startImpersonation(params: StartImpersonationParams): Promise<void> {
  const { actingUserId } = params;
  const supabase = getSupabaseServer();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, role")
    .eq("user_id", actingUserId)
    .single();

  if (error || !profile) {
    throw new Error("Profile not found");
  }

  const userId = (profile as { user_id?: string }).user_id;
  const role = (profile as { role?: string }).role ?? "user";
  if (!userId) throw new Error("Profile not found");
  await setActingUserCookie({ id: userId, role: String(role) });
}
