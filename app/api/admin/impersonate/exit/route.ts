import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { supabaseServer } from "@/lib/supabase/server";
import { writeImpersonationAudit } from "@/lib/impersonationAudit";
import { clearActingUserCookie, getActingUser } from "@/lib/auth/actingUser";

async function logImpersonationEnd(targetUserId: string | null) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return;
  try {
    await writeImpersonationAudit({
      admin_user_id: user.id,
      admin_email: user.email ?? null,
      target_user_id: targetUserId,
      target_identifier: targetUserId ? "exit" : null,
      event: "end",
      environment: "production",
    });
  } catch (e) {
    console.error("[impersonate/exit] impersonation_audit insert failed", e);
  }
}

export async function GET(request: Request) {
  const acting = await getActingUser();
  await logImpersonationEnd(acting?.id ?? null);
  await clearActingUserCookie();
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/admin", url.origin));
}

export async function POST() {
  const acting = await getActingUser();
  await logImpersonationEnd(acting?.id ?? null);
  await clearActingUserCookie();
  return NextResponse.json({ ok: true, redirectUrl: "/admin" });
}
