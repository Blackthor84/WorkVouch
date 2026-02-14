/**
 * GET /api/trades
 * Returns taxonomy of trades (slug, display_name) for dropdowns and filtering.
 * No auth required for read (public taxonomy).
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("trades")
      .select("id, slug, display_name")
      .order("display_name");

    if (error) {
      console.error("[api/trades]", error);
      return NextResponse.json(
        { error: "Failed to load trades" },
        { status: 500 }
      );
    }

    return NextResponse.json({ trades: data ?? [] });
  } catch (e) {
    console.error("[api/trades]", e);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
