import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";

export const runtime = "nodejs";

/**
 * GET /api/user/me — current user (or effective user when impersonating).
 * effectiveUserId = impersonatedUserId ?? realAuthUserId.
 * Look up by user_id only; auto-create sandbox profile if missing for impersonation.
 * Do not return 401 after profile is resolved or created.
 */
export async function GET() {
  const cookieStore = await cookies();
  const impersonatedUserId = cookieStore.get("impersonatedUserId")?.value?.trim() ?? null;

  let realAuthUserId: string | null = null;
  if (!impersonatedUserId) {
    const authed = await getAuthedUser();
    realAuthUserId = authed?.user?.id ?? null;
  }

  const effectiveUserId = impersonatedUserId ?? realAuthUserId;

  console.log("[api/user/me] effectiveUserId:", effectiveUserId);

  if (!effectiveUserId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = await supabaseServer();
  let { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, email, full_name, role, onboarding_completed")
    .eq("user_id", effectiveUserId)
    .maybeSingle();

  // Auto-create for sandbox / impersonation
  if (!profile || error) {
    console.log("[api/user/me] creating sandbox profile");
    const { error: insertErr } = await supabase.from("profiles").insert({
      user_id: effectiveUserId,
      full_name: "Impersonated User",
      email: `${effectiveUserId}@impersonated.placeholder`,
      role: "user",
      visibility: "private",
      flagged_for_fraud: false,
    });
    if (!insertErr) {
      const res = await supabase
        .from("profiles")
        .select("user_id, email, full_name, role, onboarding_completed")
        .eq("user_id", effectiveUserId)
        .maybeSingle();
      profile = res.data;
      error = res.error;
    }
  }

  // Do not return 401 after this point
  if (error || !profile) {
    return new Response("Unauthorized", { status: 401 });
  }

  const row = profile as { user_id: string; email: string | null; full_name: string; role: string | null; onboarding_completed?: boolean };
  return Response.json({
    id: row.user_id,
    email: row.email ?? undefined,
    full_name: row.full_name,
    role: row.role ?? "user",
    onboarding_complete: Boolean(row.onboarding_completed),
  });
}
