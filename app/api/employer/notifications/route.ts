/**
 * GET /api/employer/notifications — list unread + recent for current employer.
 * PATCH /api/employer/notifications — mark as read (body: { id } or { ids: [] }).
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { hasRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasRole("employer"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const supabase = await createServerSupabase();
    const { data: account } = await supabase.from("employer_accounts").select("id").eq("user_id", user.id).single();
    if (!account) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

    const adminSupabase = getSupabaseServer();
    const { data: notifications } = await adminSupabase
      .from("employer_notifications")
      .select("id, type, related_user_id, related_record_id, read, created_at")
      .eq("employer_id", account.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const list = Array.isArray(notifications) ? notifications : [];
    const unreadCount = list.filter((n: { read?: boolean }) => !n.read).length;

    return NextResponse.json({ notifications: list, unread_count: unreadCount });
  } catch (e) {
    console.error("[employer/notifications GET]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasRole("employer"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const supabase = await createServerSupabase();
    const { data: account } = await supabase.from("employer_accounts").select("id").eq("user_id", user.id).single();
    if (!account) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const id = body.id as string | undefined;
    const ids = (body.ids as string[]) ?? (id ? [id] : []);

    if (ids.length === 0) return NextResponse.json({ ok: true });

    const adminSupabase = getSupabaseServer();
    const { error } = await adminSupabase
      .from("employer_notifications")
      .update({ read: true })
      .eq("employer_id", (account as { id: string }).id)
      .in("id", ids);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[employer/notifications PATCH]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
