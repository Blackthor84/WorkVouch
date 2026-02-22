/**
 * Start impersonation: validate target profile and set acting_user cookie.
 * Used by POST /api/admin/impersonate.
 * If profile is missing but auth user exists, creates profile lazily and continues.
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

  console.log("[impersonate] received userId:", actingUserId);

  // Look up by user_id first (profiles.user_id = auth linkage; may equal id in some schemas)
  console.log("[impersonate] profile lookup query: profiles where user_id =", actingUserId);
  let result = await supabase
    .from("profiles")
    .select("id, user_id, role")
    .eq("user_id", actingUserId)
    .maybeSingle();
  let profile = result.data as { id?: string; user_id?: string; role?: string } | null;
  const byUserIdError = result.error;
  if (byUserIdError) {
    console.log("[impersonate] profile lookup by user_id error:", byUserIdError.message);
  }
  console.log("[impersonate] profile lookup by user_id result:", profile ? "found" : "not found");

  // Fallback: try by id (userId may be profiles.id)
  if (!profile) {
    console.log("[impersonate] profile lookup query: profiles where id =", actingUserId);
    result = await supabase
      .from("profiles")
      .select("id, user_id, role")
      .eq("id", actingUserId)
      .maybeSingle();
    profile = result.data as { id?: string; user_id?: string; role?: string } | null;
    if (result.error) {
      console.log("[impersonate] profile lookup by id error:", result.error.message);
    }
    console.log("[impersonate] profile lookup by id result:", profile ? "found" : "not found");
  }

  if (profile) {
    const userId = profile.user_id ?? profile.id;
    const role = profile.role ?? "user";
    if (!userId) throw new Error("Profile not found");
    await setActingUserCookie({ id: userId, role: String(role) });
    return;
  }

  // Profile missing: check if user exists in auth (users table)
  let authUser: { id: string; email?: string } | null = null;
  try {
    const { data, error } = await supabase.auth.admin.getUserById(actingUserId);
    authUser = data?.user ?? null;
    if (error) {
      console.log("[impersonate] auth.admin.getUserById error:", error.message);
    }
  } catch (e) {
    console.log("[impersonate] auth.admin.getUserById exception:", e);
  }
  console.log("[impersonate] user exists in auth (users table):", authUser ? "yes" : "no");

  if (authUser) {
    // Find-or-create: profile missing but user exists → create profile (like db.profile.create({ data: { userId, role: "user" } }))
    const { error: insertErr } = await supabase.from("profiles").insert({
      id: authUser.id,
      full_name: authUser.email ?? "User",
      email: authUser.email ?? `${authUser.id}@placeholder`,
      role: "user",
      visibility: "private",
      flagged_for_fraud: false,
    });
    if (insertErr) {
      console.error("[impersonate] lazy profile create failed:", insertErr.message);
      throw new Error("Profile not found");
    }
    console.log("[impersonate] created profile for user", authUser.id);
    await setActingUserCookie({ id: authUser.id, role: "user" });
    return;
  }

  throw new Error("Profile not found");
}
