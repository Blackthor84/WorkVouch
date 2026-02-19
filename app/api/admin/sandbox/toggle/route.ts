import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdminFromSupabase } from "@/lib/auth/admin-role-guards";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";

export const runtime = "nodejs";

/** GET: current sandbox mode (admin only). */
export async function GET() {
  const forbidden = await requireAdminFromSupabase();
  if (forbidden) return forbidden;

  const cookieStore = await cookies();
  const sandbox = cookieStore.get("sandbox_mode")?.value === "true";
  return NextResponse.json({ sandbox });
}

/**
 * POST: toggle sandbox mode. Admin only. Sandbox actions must NEVER affect production rows.
 * Requires explicit confirmation in UI before destructive actions in sandbox.
 */
export async function POST() {
  const forbidden = await requireAdminFromSupabase();
  if (forbidden) return forbidden;

  const cookieStore = await cookies();
  const current = cookieStore.get("sandbox_mode")?.value === "true";

  cookieStore.set("sandbox_mode", (!current).toString(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ sandbox: !current });
}
