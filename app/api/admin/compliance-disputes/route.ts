import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/compliance-disputes
 * List compliance disputes. Admin only.
 */
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

    const sb = getSupabaseServer();
    let query = sb
      .from("compliance_disputes")
      .select(
        "id, user_id, profile_id, dispute_type, description, status, reviewer_notes, created_at, resolved_at"
      )
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status as Database["public"]["Tables"]["compliance_disputes"]["Row"]["status"]);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("[admin/compliance-disputes] list error:", error);
      return NextResponse.json(
        { error: "Failed to fetch disputes" },
        { status: 500 }
      );
    }

    return NextResponse.json({ disputes: rows ?? [] });
  } catch (e) {
    console.error("[admin/compliance-disputes] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
