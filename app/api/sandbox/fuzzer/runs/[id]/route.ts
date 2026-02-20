/**
 * GET /api/sandbox/fuzzer/runs/[id] — get one fuzz run with snapshots. Admin-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getFuzzRun, getFuzzRunSnapshots } from "@/lib/sandbox/dsl/fuzzer/runFuzzer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const snapshots = await getFuzzRunSnapshots(id);
    return NextResponse.json({ ...run, snapshots });
  } catch (e) {
    console.error("[sandbox/fuzzer/runs/[id]]", e);
    return NextResponse.json({ error: "Failed to load run" }, { status: 500 });
  }
}
