/**
 * GET /api/user/workvouch-credential/[id] — Get one credential (owner only).
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.warn("[AUTH]", { route: "/api/user/workvouch-credential/[id]", reason: "unauthenticated" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing credential id" }, { status: 400 });

    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("workvouch_credentials")
      .select("id, candidate_id, payload, visibility, share_token, issued_at, expires_at, revoked_at, created_at, updated_at")
      .eq("id", id)
      .eq("candidate_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("[API ERROR]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
