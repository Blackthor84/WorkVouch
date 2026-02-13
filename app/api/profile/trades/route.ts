/**
 * GET /api/profile/trades — current user's selected trades.
 * PUT /api/profile/trades — set current user's trades (body: { trade_slugs: string[] }).
 * Auth required. Uses profile_id = auth.uid() for RLS.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("profile_trades")
      .select("trade_id, trades(slug, display_name)")
      .eq("profile_id", user.id);

    if (error) {
      console.error("[api/profile/trades GET]", error);
      return NextResponse.json(
        { error: "Failed to load trades" },
        { status: 500 }
      );
    }

    interface ProfileTradeRow {
      trade_id: string;
      trades: { slug: string; display_name: string } | null;
    }
    const rows = (data ?? []) as unknown as ProfileTradeRow[];
    const list = rows.map((row) => ({
      trade_id: row.trade_id,
      slug: row.trades?.slug ?? null,
      display_name: row.trades?.display_name ?? null,
    }));

    return NextResponse.json({ trades: list });
  } catch (e) {
    console.error("[api/profile/trades GET]", e);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const tradeSlugs: string[] = Array.isArray(body.trade_slugs)
      ? body.trade_slugs.filter((s: unknown): s is string => typeof s === "string")
      : [];

    const supabase = await createServerSupabase();

    type TradeRow = { id: string };
    let validIds: string[] = [];
    if (tradeSlugs.length > 0) {
      const { data: tradeRows } = await supabase
        .from("trades")
        .select("id")
        .in("slug", tradeSlugs);
      validIds = (tradeRows ?? []).map((r: TradeRow) => r.id);
    }

    await supabase
      .from("profile_trades")
      .delete()
      .eq("profile_id", user.id);

    if (validIds.length > 0) {
      const { error: insertErr } = await supabase.from("profile_trades").insert(
        validIds.map((trade_id) => ({
          profile_id: user.id,
          trade_id,
        }))
      );
      if (insertErr) {
        console.error("[api/profile/trades PUT]", insertErr);
        return NextResponse.json(
          { error: "Failed to save trades" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, count: validIds.length });
  } catch (e) {
    console.error("[api/profile/trades PUT]", e);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
