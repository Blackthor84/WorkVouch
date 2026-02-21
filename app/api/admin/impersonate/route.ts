import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { supabaseServer } from "@/lib/supabase/server";
import { setActingUserCookie } from "@/lib/auth/actingUser";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectUrlForRole(role: string): string {
  const r = role.trim().toLowerCase();
  if (r === "employer") return "/employer/dashboard";
  if (r === "employee") return "/dashboard/worker";
  if (r === "admin" || r === "superadmin" || r === "super_admin") return "/admin";
  return "/dashboard";
}

/** POST /api/admin/impersonate — superadmin only. Body: { userId }. Sets acting_user cookie and returns success + redirectUrl. */
export async function POST(req: Request) {
  const forbidden = await requireSuperadmin();
  if (forbidden) return forbidden;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { userId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const userId = typeof body?.userId === "string" ? body.userId.trim() : null;
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const adminSupabase = getSupabaseServer();
  const { data: profile, error } = await adminSupabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 400 });
  }

  const role = (profile as { role?: string }).role ?? "user";
  await setActingUserCookie({ id: profile.id, role: String(role) });

  const redirectUrl = redirectUrlForRole(role);
  return NextResponse.json({ success: true, redirectUrl });
}
