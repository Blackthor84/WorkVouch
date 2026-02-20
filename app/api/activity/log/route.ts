/**
 * POST /api/activity/log — log user activity to activity_log (RLS; user-owned).
 * Requires authenticated user. Body: { action, target?, metadata? }.
 */

import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { insertActivityLog } from "@/lib/admin/activityLog";

export async function POST(req: Request) {
  const authed = await getAuthedUser();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action =
    typeof body.action === "string" ? body.action.trim().slice(0, 256) : null;
  const target =
    typeof body.target === "string" ? body.target.trim().slice(0, 512) : undefined;
  const metadata =
    body.metadata && typeof body.metadata === "object"
      ? (body.metadata as Record<string, unknown>)
      : undefined;

  if (!action) {
    return NextResponse.json({ error: "Bad request: action required" }, { status: 400 });
  }

  try {
    await insertActivityLog({
      userId: authed.user.id,
      action,
      target: target ?? null,
      metadata: metadata ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[activity/log]", e);
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 });
  }
}
