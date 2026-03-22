// IMPORTANT:
// All server routes must use the `admin` Supabase client.

/**
 * GET /api/admin/metrics
 * Platform-wide coworker invite funnel (aggregates only). Admin/superadmin (+ god mode) only.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { admin } from "@/lib/supabase-admin";
import { logAudit } from "@/lib/soc2-audit";
import { withRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function countInvites(
  filter?: (q: ReturnType<typeof admin.from>) => ReturnType<typeof admin.from>
): Promise<number> {
  let q = admin.from("coworker_invites").select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  if (error) {
    console.warn("[admin/metrics] count error:", error.message);
    return 0;
  }
  return typeof count === "number" ? count : 0;
}

export async function GET(req: NextRequest) {
  const adminSession = await requireAdminForApi();
  if (!adminSession) return adminForbiddenResponse();

  const rateLimitResult = withRateLimit(req, {
    userId: adminSession.authUserId ?? null,
    windowMs: 60_000,
    maxPerWindow: 60,
    prefix: "admin_metrics:",
  });
  if (!rateLimitResult.allowed) return rateLimitResult.response;

  await logAudit({
    actorId: adminSession.authUserId,
    action: "VIEW_ADMIN_INVITE_METRICS",
    resource: "admin/metrics",
    metadata: { scope: "coworker_invites_aggregate" },
  });

  const [total, pending, accepted, declined, opened, inviteDispatched] = await Promise.all([
    countInvites(),
    countInvites((q) => q.eq("status", "pending")),
    countInvites((q) => q.eq("status", "accepted")),
    countInvites((q) => q.eq("status", "declined")),
    countInvites((q) => q.not("invite_opened_at", "is", null)),
    countInvites((q) => q.not("invite_sent_at", "is", null)),
  ]);

  const sent = pending;
  const openRate = total ? ((opened / total) * 100).toFixed(1) : "0";
  const acceptRate = total ? ((accepted / total) * 100).toFixed(1) : "0";

  return NextResponse.json({
    total,
    sent,
    opened,
    accepted,
    declined,
    invite_dispatched: inviteDispatched,
    openRate,
    acceptRate,
  });
}
