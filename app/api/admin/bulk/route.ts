import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireAdmin, assertAdminCanModify } from "@/lib/admin/requireAdmin";
import { insertAdminAuditLog } from "@/lib/admin/audit";
import { calculateUserIntelligence } from "@/lib/intelligence/calculateUserIntelligence";

export const dynamic = "force-dynamic";

type BulkAction = "suspend" | "soft_delete" | "recalculate" | "fraud_flag" | "downgrade_employers" | "delete_reviews";

/** POST: bulk moderation. Body: { action: BulkAction, user_ids: string[] } or { action: "delete_reviews", review_ids: string[] } */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({})) as {
      action: BulkAction;
      user_ids?: string[];
      review_ids?: string[];
    };
    const { action, user_ids = [], review_ids = [] } = body;
    if (!action) return NextResponse.json({ success: false, error: "Missing action" }, { status: 400 });

    const supabase = getSupabaseServer();
    const results: { id: string; success: boolean; error?: string }[] = [];

    if (action === "delete_reviews" && review_ids.length > 0) {
      for (const id of review_ids) {
        const { data: row } = await supabase.from("employment_references").select("reviewed_user_id").eq("id", id).single();
        const { error } = await supabase.from("employment_references").delete().eq("id", id);
        if (error) {
          results.push({ id, success: false, error: error.message });
        } else {
          const uid = (row as { reviewed_user_id?: string } | null)?.reviewed_user_id;
          if (uid) await calculateUserIntelligence(uid);
          await insertAdminAuditLog({ adminId: admin.userId, targetUserId: uid ?? id, action: "peer_review_delete", newValue: { review_id: id } });
          results.push({ id, success: true });
        }
      }
      return NextResponse.json({ success: true, results });
    }

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({ success: false, error: "Missing user_ids" }, { status: 400 });
    }

    for (const targetUserId of user_ids) {
      const { data: profile } = await supabase.from("profiles").select("id, role").eq("id", targetUserId).single();
      if (!profile) {
        results.push({ id: targetUserId, success: false, error: "User not found" });
        continue;
      }
      const targetRole = (profile as { role?: string }).role ?? "user";
      try {
        assertAdminCanModify(admin, targetUserId, targetRole);
      } catch (e) {
        results.push({ id: targetUserId, success: false, error: e instanceof Error ? e.message : "Forbidden" });
        continue;
      }

      if (action === "suspend") {
        const { error } = await supabase.from("profiles").update({ status: "suspended" }).eq("id", targetUserId);
        if (error) results.push({ id: targetUserId, success: false, error: error.message });
        else {
          await insertAdminAuditLog({ adminId: admin.userId, targetUserId, action: "suspend", newValue: { status: "suspended" } });
          results.push({ id: targetUserId, success: true });
        }
      } else if (action === "soft_delete") {
        const now = new Date().toISOString();
        const { error } = await supabase.from("profiles").update({ status: "deleted", deleted_at: now }).eq("id", targetUserId);
        if (error) results.push({ id: targetUserId, success: false, error: error.message });
        else {
          await insertAdminAuditLog({ adminId: admin.userId, targetUserId, action: "soft_delete", newValue: { status: "deleted", deleted_at: now } });
          results.push({ id: targetUserId, success: true });
        }
      } else if (action === "recalculate") {
        try {
          await calculateUserIntelligence(targetUserId);
          await insertAdminAuditLog({ adminId: admin.userId, targetUserId, action: "recalculate" });
          results.push({ id: targetUserId, success: true });
        } catch (e) {
          results.push({ id: targetUserId, success: false, error: e instanceof Error ? e.message : "Recalc failed" });
        }
      } else if (action === "fraud_flag") {
        const { error } = await supabase.from("profiles").update({ flagged_for_fraud: true }).eq("id", targetUserId);
        if (error) results.push({ id: targetUserId, success: false, error: error.message });
        else {
          await insertAdminAuditLog({ adminId: admin.userId, targetUserId, action: "profile_update", newValue: { flagged_for_fraud: true } });
          results.push({ id: targetUserId, success: true });
        }
      } else if (action === "downgrade_employers") {
        const { error } = await supabase.from("employer_accounts").update({ plan_tier: "free" }).eq("user_id", targetUserId);
        if (error) results.push({ id: targetUserId, success: false, error: error.message });
        else results.push({ id: targetUserId, success: true });
      } else {
        results.push({ id: targetUserId, success: false, error: "Unknown action" });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
