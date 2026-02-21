import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { supabaseServer } from "@/lib/supabase/server";
import { setActingUserCookie } from "@/lib/auth/actingUser";
import { getSupabaseServer } from "@/lib/supabase/admin";

function redirectUrlForRole(role: string): string {
  const r = role.trim().toLowerCase();
  if (r === "employer") return "/employer/dashboard";
  if (r === "employee") return "/dashboard/worker";
  if (r === "admin" || r === "superadmin" || r === "super_admin") return "/admin";
  return "/dashboard";
}

export async function POST(req: Request) {
  const forbidden = await requireSuperadmin();
  if (forbidden) return forbidden;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const body = await req.json();
  const userId = typeof body?.userId === "string" ? body.userId.trim() : null;
  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const adminSupabase = getSupabaseServer();
  const { data: profile, error } = await adminSupabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  const role = (profile as { role?: string }).role ?? "user";
  await setActingUserCookie({ id: profile.id, role: String(role) });

  const redirectUrl = redirectUrlForRole(role);
  return Response.json({ success: true, redirectUrl });
}
