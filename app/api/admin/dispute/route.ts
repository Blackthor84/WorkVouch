/**
 * GET /api/admin/dispute
 * List user-initiated disputes (disputes table). Secure with admin role.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const disputeType = searchParams.get("dispute_type");

    const sb = getSupabaseServer() as any;
    let query = sb
      .from("disputes")
      .select("id, user_id, dispute_type, related_record_id, description, status, resolution_summary, resolved_by, resolved_at, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (disputeType) query = query.eq("dispute_type", disputeType);

    const { data: disputes, error } = await query;

    if (error) {
      console.error("[admin/dispute] list error:", error);
      return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
    }

    return NextResponse.json({ disputes: disputes ?? [] });
  } catch (e) {
    console.error("[admin/dispute] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
