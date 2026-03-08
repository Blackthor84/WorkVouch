// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { admin } from "@/lib/supabase-admin";
import { requireAdminForApi } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";

export const dynamic = "force-dynamic";

/** GET: list fraud signals for dashboard (all or by type). */
export async function GET(req: NextRequest) {
  const _session = await requireAdminForApi();
  if (!_session) return adminForbiddenResponse();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);
  let query = admin.from("fraud_signals")
    .select("id, user_id, signal_type, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (type) query = query.eq("signal_type", type);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
