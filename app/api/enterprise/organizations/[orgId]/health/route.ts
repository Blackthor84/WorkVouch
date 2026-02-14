/**
 * GET /api/enterprise/organizations/[orgId]/health
 * Returns org health for dashboard UX (enterprise_recommended when misaligned).
 * Requires org access (enterprise owner/location admin).
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";
import { getOrgHealthScore } from "@/lib/enterprise/orgHealthScore";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  props: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await props.params;
    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });
    await requireEnterpriseOwner(orgId);
    const health = await getOrgHealthScore(orgId);
    return NextResponse.json({
      status: health.status,
      score: health.score,
      enterprise_recommended: health.status === "misaligned" || health.enterpriseRecommended,
      summary: health.summary,
      recommended_plan: health.recommended_plan,
      hint: health.status === "misaligned" ? "Enterprise Recommended: multi-location or high-volume activity detected." : health.enterpriseRecommended ? health.summary : null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    if (msg.includes("Unauthorized") || msg.includes("access")) return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
