/**
 * GET /api/user/workvouch-credential/[id] — Get one credential (owner only).
 * PATCH /api/user/workvouch-credential/[id] — Revoke credential (sets revoked_at). Old share links stop working immediately.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";

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

    const supabase = createServerSupabaseClient();
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const reject = await rejectWriteIfImpersonating();
    if (reject) return reject;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing credential id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const revoke = (body as { revoke?: boolean }).revoke === true;
    if (!revoke) {
      return NextResponse.json({ error: "Send { revoke: true } to revoke" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("workvouch_credentials")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("candidate_id", user.id)
      .select("id, revoked_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Credential not found or already revoked" }, { status: 404 });
    }

    return NextResponse.json({ success: true, revoked_at: (data as { revoked_at: string }).revoked_at });
  } catch (e) {
    console.error("[API ERROR]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
