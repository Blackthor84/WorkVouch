import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";

/**
 * PATCH: employer overrides (superadmin only).
 * Body: plan_tier, billing_cycle_start, billing_cycle_end, reports_used, searches_used, seats_used, seats_allowed, add_credit, remove_credit.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: employerId } = await params;
    if (!employerId) return NextResponse.json({ success: false, error: "Missing employer id" }, { status: 400 });
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const supabase = getSupabaseServer();
    const { data: employer } = await supabase.from("employer_accounts").select("id, user_id").eq("id", employerId).single();
    if (!employer) return NextResponse.json({ success: false, error: "Employer not found" }, { status: 404 });
    const updates: Record<string, unknown> = {};
    if (body.plan_tier !== undefined) updates.plan_tier = body.plan_tier;
    if (body.billing_cycle_start !== undefined) updates.billing_cycle_start = body.billing_cycle_start;
    if (body.billing_cycle_end !== undefined) updates.billing_cycle_end = body.billing_cycle_end;
    if (body.reports_used !== undefined) updates.reports_used = Number(body.reports_used);
    if (body.searches_used !== undefined) updates.searches_used = Number(body.searches_used);
    if (Object.keys(updates).length === 0) return NextResponse.json({ success: true });
    const { error } = await supabase.from("employer_accounts").update(updates).eq("id", employerId);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden" || msg.startsWith("Forbidden:")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
