/**
 * GET /api/admin/employer-reputation?employer_id=...
 * Return employer_reputation_snapshots row for an employer. Admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSupabase } from "@/lib/auth/requireAdminSupabase";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminSupabase();
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const employerId = searchParams.get("employer_id");
    if (!employerId) return NextResponse.json({ error: "employer_id required" }, { status: 400 });

    const sb = getSupabaseServer() as any;
    const { data: snapshot, error } = await sb
      .from("employer_reputation_snapshots")
      .select("*")
      .eq("employer_id", employerId)
      .single();

    if (error || !snapshot) {
      return NextResponse.json({ error: "No snapshot found. Reputation may not have been calculated yet." }, { status: 404 });
    }

    return NextResponse.json({ snapshot });
  } catch (e) {
    console.error("[admin/employer-reputation]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
