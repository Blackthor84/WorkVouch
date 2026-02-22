/**
 * Start impersonation: UUID-only. No sandbox string IDs.
 * Used by sandbox playground; POST /api/admin/impersonate validates and sets cookie directly.
 */
import { getSupabaseServer } from "@/lib/supabase/admin";
import { setActingUserCookie } from "@/lib/auth/actingUser";

/** UUID v4 guard. */
export function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export type StartImpersonationParams = {
  authUserId: string;
  actingUserId: string;
};

/**
 * Legacy: sets acting_user cookie for UUID only. Caller must have validated UUID and user existence.
 * Sandbox string IDs are not supported.
 */
export async function startImpersonation(params: StartImpersonationParams): Promise<void> {
  const userId = params.actingUserId.trim();
  if (!isUUID(userId)) {
    throw new Error("Impersonation requires a valid user UUID. Sandbox string IDs are not supported.");
  }
  const supabase = getSupabaseServer();
  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
  if (authError || !authData?.user) {
    throw new Error("User not found");
  }
  await setActingUserCookie({ id: userId, role: "user" });
}
