/**
 * GET /api/sandbox/fuzz/runs/[id]/snapshots — get trust snapshots for a fuzz run. Admin-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getFuzzRunSnapshots } from "@/lib/sandbox/dsl/fuzzer/runFuzzer";

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
    const snapshots = await getFuzzRunSnapshots(id);
    return NextResponse.json(snapshots);
  } catch (e) {
    console.error("[sandbox/fuzz/runs/[id]/snapshots]", e);
    return NextResponse.json({ error: "Failed to fetch snapshots" }, { status: 500 });
  }
}
