/**
 * Start impersonation: profile-only. Look up by user_id only; auto-create sandbox profiles.
 * Used by POST /api/admin/impersonate.
 * NEVER query profiles.id. NEVER assume numeric IDs or UUIDs for lookup.
 */
import { getSupabaseServer } from "@/lib/supabase/admin";
import { setActingUserCookie } from "@/lib/auth/actingUser";

/** UUID v4 guard — use only to decide whether to validate Supabase Auth. Stops crashes from invalid ids. */
export function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export type StartImpersonationParams = {
  authUserId: string;
  actingUserId: string;
};

export async function startImpersonation(params: StartImpersonationParams): Promise<void> {
  const userId = params.actingUserId.trim();
  const supabase = getSupabaseServer();

  console.log("[impersonate] received userId:", userId);

  // ONLY lookup by user_id (exact column name). Never query profiles.id.
  const { data: profileRow, error } = await supabase
    .from("profiles")
    .select("user_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  let profile = profileRow as { user_id?: string; role?: string } | null;
  if (error) {
    console.log("[impersonate] profile lookup error:", error.message);
  }

  if (!profile) {
    console.warn("[impersonate] profile missing");

    // Auto-create profile only when userId is UUID (real auth user); then profile exists in DB
    if (isUUID(userId)) {
      const { data: authData } = await supabase.auth.admin.getUserById(userId);
      if (authData?.user) {
        const { error: insertErr } = await supabase.from("profiles").insert({
          id: userId,
          full_name: authData.user.email ?? "User",
          email: authData.user.email ?? `${userId}@placeholder`,
          role: "employee",
          visibility: "private",
          flagged_for_fraud: false,
        });
        if (!insertErr) {
          profile = { user_id: userId, role: "employee" };
        }
      }
    }
    // Sandbox (non-UUID): no profile row; we still impersonate by setting cookie with userId
    if (!profile) {
      profile = { user_id: userId, role: "employee" };
    }
  }

  // Only check Supabase Auth if UUID (real auth user)
  if (isUUID(userId)) {
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError || !authData?.user) {
      throw new Error("Auth user not found");
    }
  } else {
    console.log("[impersonate] sandbox user — skipping auth");
  }

  const actingId = profile?.user_id ?? userId;
  const role = profile?.role ?? "user";
  await setActingUserCookie({ id: actingId, role: String(role) });
}
