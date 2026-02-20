/**
 * GET /api/sandbox/fuzz/runs — list fuzz runs. Admin-only.
 * Query: sandbox_id?, limit?
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
    const sandboxId = req.nextUrl.searchParams.get("sandbox_id") ?? undefined;
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 50, 100);
    const runs = await listFuzzRuns(sandboxId, limit);
    return NextResponse.json(runs);
  } catch (e) {
    console.error("[sandbox/fuzz/runs]", e);
    return NextResponse.json([], { status: 200 });
  }
}
