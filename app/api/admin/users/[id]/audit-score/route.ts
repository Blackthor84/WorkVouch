import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import {
  getEmployeeAuditScore,
  calculateAndPersistEmployeeAuditScore,
  getAuditLabel,
} from "@/lib/scoring/employeeAuditScore";

export const dynamic = "force-dynamic";

/** GET: full employee audit score breakdown (admin only). Recalculates if missing. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const _session = await requireAdminForApi();
  if (!_session) return adminForbiddenResponse();
  try {
    const { id: userId } = await params;
    if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

    let result = await getEmployeeAuditScore(userId);
    if (!result) {
      const computed = await calculateAndPersistEmployeeAuditScore(userId);
      result = computed.result ?? null;
    }
    if (!result) return NextResponse.json({ error: "Could not compute audit score" }, { status: 500 });

    return NextResponse.json({
      score: result.score,
      band: result.band,
      label: getAuditLabel(result.band),
      breakdown: result.breakdown,
      calculatedAt: result.calculatedAt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
