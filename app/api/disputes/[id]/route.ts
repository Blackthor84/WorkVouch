import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/disputes/[id]
 * Return one compliance dispute. User sees own; admin sees any.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const sb = getSupabaseServer() as ReturnType<typeof getSupabaseServer>;

    const { data: row, error } = await sb
      .from("compliance_disputes")
      .select(
        "id, user_id, profile_id, dispute_type, description, status, reviewer_notes, created_at, resolved_at"
      )
      .eq("id", id)
      .single();

    if (error || !row) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    const admin = await isAdmin();
    const isOwn = (row as { user_id: string }).user_id === user.id;
    if (!admin && !isOwn) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(row);
  } catch (e) {
    console.error("[api/disputes/[id]] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
