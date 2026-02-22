import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/user/me — effective user when impersonating (cookie-only).
 * Impersonation is UUID-only; cookie must be set to real user UUID.
 */
export async function GET() {
  const cookieStore = await cookies();
  const effectiveUserId =
    cookieStore.get("impersonatedUserId")?.value?.trim() ?? null;

  if (!effectiveUserId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = await supabaseServer();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, email, full_name, role, onboarding_completed")
    .eq("user_id", effectiveUserId)
    .maybeSingle();

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
