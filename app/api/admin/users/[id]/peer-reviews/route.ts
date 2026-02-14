import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";

export const dynamic = "force-dynamic";

/** GET: peer reviews (employment_references) for this user: received (reviewed_user_id) and sent (reviewer_id). Admin forensics / audit chain. */
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
    const [receivedRes, sentRes] = await Promise.all([
      supabase
        .from("employment_references")
        .select("id, employment_match_id, reviewer_id, reviewed_user_id, rating, comment, created_at")
        .eq("reviewed_user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("employment_references")
        .select("id, employment_match_id, reviewer_id, reviewed_user_id, rating, comment, created_at")
        .eq("reviewer_id", userId)
        .order("created_at", { ascending: false }),
    ]);
    if (receivedRes.error) return NextResponse.json({ error: receivedRes.error.message }, { status: 500 });
    if (sentRes.error) return NextResponse.json({ error: sentRes.error.message }, { status: 500 });
    const received = (receivedRes.data ?? []).map((r) => ({ ...r, direction: "received" as const }));
    const sent = (sentRes.data ?? []).map((r) => ({ ...r, direction: "sent" as const }));
    return NextResponse.json([...received, ...sent].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
