import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/getUser";
import { admin } from "@/lib/supabase-admin";
import { FOUNDER_EMAIL, isFounderEmail } from "@/lib/auth/founder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["employee", "employer"]);

/**
 * POST /api/user/choose-role
 * Sets profiles.role to employee or employer only. Cannot set super_admin (founder-only).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { role?: string };
    const role = typeof body.role === "string" ? body.role.trim().toLowerCase() : "";
    if (!ALLOWED.has(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isFounderEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: row, error: fetchErr } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const current = String((row as { role?: string | null } | null)?.role ?? "").toLowerCase();
    if (current === "super_admin" || user.email?.toLowerCase() === FOUNDER_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatePayload =
      role === "employer" ? ({ role, plan: "free" } as const) : ({ role } as const);
    const { error: upErr } = await admin.from("profiles").update(updatePayload).eq("id", user.id);
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, role });
  } catch (e) {
    console.error("[choose-role]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
