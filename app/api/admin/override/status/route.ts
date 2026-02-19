/**
 * GET /api/admin/override/status — returns whether production override is active. Admin-only.
 */

import { NextResponse } from "next/server";
import { getAdminContext, adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getAdminOverrideStatus } from "@/lib/admin/overrideStatus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) return adminForbiddenResponse();

  const status = await getAdminOverrideStatus();
  return NextResponse.json({
    active: status.active,
    expiresAt: status.expiresAt ?? null,
  });
}
