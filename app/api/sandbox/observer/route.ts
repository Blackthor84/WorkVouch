import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getSandboxObserverData } from "@/lib/sandbox/observerData";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/sandbox/observer — read-only real data from sandbox_intelligence_outputs. ADMIN only. */
export async function GET(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  const sandboxId =
    req.nextUrl.searchParams.get("sandboxId")?.trim() ||
    req.nextUrl.searchParams.get("sandbox_id")?.trim() ||
    undefined;

  const data = await getSandboxObserverData(sandboxId);
  return NextResponse.json(data);
}
