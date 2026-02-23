/**
 * POST /api/activity/log — log user activity to activity_log (RLS; user-owned).
 * Requires authenticated user. Body: { action, target?, metadata? }.
 * Uses effective user id (impersonated_user_id ?? auth.uid()). Writes are disabled during impersonation.
 */

import { NextResponse } from "next/server";
import { getEffectiveUserId } from "@/lib/server/effectiveUserId";
import { insertActivityLog } from "@/lib/activity";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";

export async function POST(req: Request) {
  const reject = await rejectWriteIfImpersonating();
  if (reject) return reject;

  const effectiveUserId = await getEffectiveUserId();
  if (!effectiveUserId) {
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
      userId: effectiveUserId,
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
