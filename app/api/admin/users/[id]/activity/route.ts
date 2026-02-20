import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireAdminForApi } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";

export const dynamic = "force-dynamic";

/** GET: user activity (activity_log) for timeline (admin only). Returns shape { id, type, metadata, created_at } for Session Activity tab. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const _session = await requireAdminForApi();
  if (!_session) return adminForbiddenResponse();
  try {
    const { id: userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }
    const supabase = getSupabaseServer();
    const { data: rows, error } = await supabase
      .from("activity_log")
      .select("id, action, target, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Shape for forensics tab: type (action), metadata (include target)
    const data = (rows ?? []).map((r) => ({
      id: r.id,
      type: r.action,
      metadata: { ...(r.target ? { target: r.target } : {}), ...(r.metadata as object ?? {}) },
      created_at: r.created_at,
    }));
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
