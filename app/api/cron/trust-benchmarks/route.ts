// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * POST /api/cron/trust-benchmarks
 * Nightly aggregation: run aggregate_trust_industry_benchmarks().
 * Call from cron; protect with CRON_SECRET or admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { error } = await admin.rpc("aggregate_trust_industry_benchmarks");
    if (error) {
      console.error("[cron/trust-benchmarks]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[cron/trust-benchmarks]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
