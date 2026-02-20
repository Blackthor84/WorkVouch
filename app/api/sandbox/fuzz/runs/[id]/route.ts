/**
 * GET /api/sandbox/fuzz/runs/[id] — get one fuzz run. Admin-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getFuzzRun } from "@/lib/sandbox/dsl/fuzzer/runFuzzer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing run id" }, { status: 400 });
  }

  try {
    const run = await getFuzzRun(id);
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    return NextResponse.json(run);
  } catch (e) {
    console.error("[sandbox/fuzz/runs/[id]]", e);
    return NextResponse.json({ error: "Failed to fetch run" }, { status: 500 });
  }
}
