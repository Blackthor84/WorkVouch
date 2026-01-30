import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { enforceLimit } from "@/lib/enforceLimit";
import { incrementUsage } from "@/lib/usage";

/**
 * POST /api/employer/add-seat
 * Add a seat. If seats_used >= seats_allowed, triggers Stripe seat overage metered usage then increments seats_used.
 * PATCH or DELETE to remove a seat (not below 1).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isEmployer = await hasRole("employer");
    if (!isEmployer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseServer() as any;
    const { data: account, error: accError } = await supabase
      .from("employer_accounts")
      .select("id, plan_tier, reports_used, searches_used, seats_used, seats_allowed, stripe_report_overage_item_id, stripe_search_overage_item_id, stripe_seat_overage_item_id")
      .eq("user_id", user.id)
      .single();

    if (accError || !account) {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    }

    const result = await enforceLimit(account as any, "seats");
    if (!result.allowed) {
      return NextResponse.json(
        { error: result.error || "Plan limit reached", limitReached: true },
        { status: 403 },
      );
    }

    const { ok, error } = await incrementUsage(account.id, "seat_add", 1);
    if (!ok) {
      return NextResponse.json(
        { error: error || "Failed to add seat" },
        { status: 500 }
      );
    }

    const { data: updated } = await supabase
      .from("employer_accounts")
      .select("seats_used, seats_allowed")
      .eq("id", account.id)
      .single();

    return NextResponse.json({
      success: true,
      seats_used: updated?.seats_used ?? account.seats_used + 1,
      seats_allowed: updated?.seats_allowed ?? account.seats_allowed,
    });
  } catch (e) {
    console.error("[add-seat] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/employer/add-seat
 * Remove one seat. Cannot go below 1.
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isEmployer = await hasRole("employer");
    if (!isEmployer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseServer() as any;
    const { data: account, error: accError } = await supabase
      .from("employer_accounts")
      .select("id, seats_used")
      .eq("user_id", user.id)
      .single();

    if (accError || !account) {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    }

    const current = Number(account.seats_used ?? 1);
    if (current <= 1) {
      return NextResponse.json(
        { error: "Cannot reduce seats below 1" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("employer_accounts")
      .update({ seats_used: current - 1 })
      .eq("id", account.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update seats" },
        { status: 500 }
      );
    }

    await supabase.from("usage_logs").insert({
      employer_id: account.id,
      action_type: "seat_remove",
      quantity: 1,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      seats_used: current - 1,
    });
  } catch (e) {
    console.error("[remove-seat] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
