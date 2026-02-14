/**
 * POST /api/employment/confirm-match
 * Match confirmation is not supported (employment_matches does not exist).
 * Coworker state is read from coworker_matches only. Returns 404 so clients can degrade gracefully.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { session } = await getSupabaseSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Match confirmation is not available; matches are managed via coworker_matches" },
      { status: 404 }
    );
  } catch (e) {
    console.error("[confirm-match] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
