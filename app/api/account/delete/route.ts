/**
 * POST /api/account/delete
 * User-initiated soft delete. Requires auth.
 * Sets is_deleted = true, deleted_at = now(), revokes effective session, logs audit.
 * Data purged after 30 days by CRON /api/cron/purge-deleted-users.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const sb = getSupabaseServer();

    const { data: profile } = await sb
      .from("profiles")
      .select("id, is_deleted, deleted_at, status")
      .eq("id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if ((profile as { is_deleted?: boolean }).is_deleted) {
      return NextResponse.json(
        { error: "Account is already marked for deletion" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      is_deleted: true,
      deleted_at: now,
    };
    const { data: statusCol } = await sb
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .single();
    if (statusCol && "status" in statusCol) {
      updatePayload.status = "deleted";
    }

    const { error: updateError } = await sb
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId);

    if (updateError) {
      console.error("Account delete update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update account" },
        { status: 500 }
      );
    }

    await sb.from("audit_logs").insert({
      entity_type: "account",
      entity_id: userId,
      changed_by: userId,
      new_value: { is_deleted: true, deleted_at: now },
      change_reason: "user_initiated_delete",
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Account delete error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
