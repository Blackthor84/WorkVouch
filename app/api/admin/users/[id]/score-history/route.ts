import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";

/** GET: intelligence score diff history for user (admin only). Old score, new score, trigger, timestamp. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: userId } = await params();
    if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("intelligence_score_history")
      .select("id, previous_score, new_score, delta, reason, triggered_by, created_at")
      .eq("user_id", userId)
      .eq("entity_type", "trust_score")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
