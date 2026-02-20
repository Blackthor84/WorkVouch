/**
 * GET /api/sandbox/fuzzer/runs — list fuzz runs. Admin-only.
 * Query: sandbox_id (optional), limit (default 50)
 */

import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { listFuzzRuns } from "@/lib/sandbox/dsl/fuzzer/runFuzzer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  try {
    const sp = req.nextUrl.searchParams;
    const sandbox_id = sp.get("sandbox_id") ?? undefined;
    const limit = Math.min(Number(sp.get("limit")) || 50, 100);
    const runs = await listFuzzRuns(sandbox_id, limit);
    return NextResponse.json(runs);
  } catch (e) {
    console.error("[sandbox/fuzzer/runs]", e);
    return NextResponse.json([], { status: 200 });
  }
}
