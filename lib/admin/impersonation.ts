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
    .select("id, role")
    .eq("id", actingUserId)
    .single();

  if (error || !profile) {
    throw new Error("Profile not found");
  }

  const role = (profile as { role?: string }).role ?? "user";
  await setActingUserCookie({ id: profile.id, role: String(role) });
}
