import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";

export const dynamic = "force-dynamic";

/** GET: list fraud signals for dashboard (all or by type). */
export async function GET(req: NextRequest) {
  const _session = await requireAdminForApi();
  if (!_session) return adminForbiddenResponse();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);
  const supabase = getSupabaseServer();
  let query = supabase
    .from("fraud_signals")
    .select("id, user_id, signal_type, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (type) query = query.eq("signal_type", type);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
