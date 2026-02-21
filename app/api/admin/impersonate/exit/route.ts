import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { writeImpersonationAudit } from "@/lib/impersonationAudit";
import { jwtVerify } from "jose";

const IMPERSONATE_USER_COOKIE = "impersonate_user";
const WORKVOUCH_IMPERSONATION_COOKIE = "workvouch_impersonation";

async function logImpersonationEnd(impersonationToken?: string | null, impersonateUserId?: string | null) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return;
  let targetUserId: string | null = impersonateUserId ?? null;
  if (!targetUserId && impersonationToken) {
    try {
      const secret = new TextEncoder().encode(
        process.env.NEXTAUTH_SECRET || process.env.IMPERSONATION_JWT_SECRET || "impersonation-secret"
      );
      const { payload } = await jwtVerify(impersonationToken, secret);
      targetUserId = (payload.impersonated_user_id as string) ?? null;
    } catch {
      // ignore
    }
  }
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
  const cookieStore = await cookies();
  const impersonateUser = cookieStore.get(IMPERSONATE_USER_COOKIE)?.value?.trim();
  const token = cookieStore.get(WORKVOUCH_IMPERSONATION_COOKIE)?.value;
  await logImpersonationEnd(token, impersonateUser || undefined);
  cookieStore.set(IMPERSONATE_USER_COOKIE, "", { maxAge: 0, path: "/" });
  cookieStore.set(WORKVOUCH_IMPERSONATION_COOKIE, "", { maxAge: 0, path: "/" });
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/admin", url.origin));
}

export async function POST() {
  const cookieStore = await cookies();
  const impersonateUser = cookieStore.get(IMPERSONATE_USER_COOKIE)?.value?.trim();
  const token = cookieStore.get(WORKVOUCH_IMPERSONATION_COOKIE)?.value;
  await logImpersonationEnd(token, impersonateUser || undefined);
  cookieStore.set(IMPERSONATE_USER_COOKIE, "", { maxAge: 0, path: "/" });
  cookieStore.set(WORKVOUCH_IMPERSONATION_COOKIE, "", { maxAge: 0, path: "/" });
  return NextResponse.json({ ok: true });
}
