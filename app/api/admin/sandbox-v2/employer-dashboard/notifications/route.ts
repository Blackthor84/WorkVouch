/**
 * GET /api/admin/sandbox-v2/employer-dashboard/notifications
 * Sandbox equivalent of GET /api/employer/notifications.
 * No sandbox notifications table; return same shape with empty list.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    req.nextUrl.searchParams.get("sandboxId"); // optional, for consistency
    return NextResponse.json({ notifications: [], unread_count: 0 });
  } catch (e) {
    console.error("[sandbox employer-dashboard notifications]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
