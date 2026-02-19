/**
 * GET /api/admin/incidents — list incidents. Admin only. Filter by environment, status, severity.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { listIncidents } from "@/lib/admin/incidents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await getAdminContext(req);
  if (!admin.isAdmin) return adminForbiddenResponse();

  try {
    const url = new URL(req.url);
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
    const environment = url.searchParams.get("environment") as "prod" | "sandbox" | undefined;
    const status = url.searchParams.get("status") as "open" | "mitigated" | "resolved" | undefined;
    const severity = url.searchParams.get("severity") as "low" | "medium" | "high" | "critical" | undefined;

    const data = await listIncidents({ environment, status, severity, limit });
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error("[admin/incidents]", e);
    return NextResponse.json([], { status: 200 });
  }
}
