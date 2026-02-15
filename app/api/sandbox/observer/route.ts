import { NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/sandbox/observer — read-only. ADMIN only. Cookies required (credentials: "include"). */
export async function GET() {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  return NextResponse.json({
    trustDelta: 0,
    culture: [],
    signals: [],
    abuseRisk: 0,
  });
}
