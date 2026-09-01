import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/getUser";
import { findInvitesForSender } from "@/lib/invites/coworkerVouchInviteStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/invites/stats
 * Aggregates public.invites for the signed-in sender.
 * Production has no `sent` status — dispatch is inferred from opened/accepted/declined.
 */
export async function GET() {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invites, error } = await findInvitesForSender(user.id);

  if (error) {
    return NextResponse.json({ error: error.message ?? "Could not load invite stats" }, { status: 500 });
  }

  const total = invites.length;
  const sent = invites.filter((i) => (i.status ?? "").toLowerCase() === "pending").length;
  const opened = invites.filter((i) => (i.status ?? "").toLowerCase() === "opened").length;
  const accepted = invites.filter((i) => (i.status ?? "").toLowerCase() === "accepted").length;
  const declined = invites.filter((i) => (i.status ?? "").toLowerCase() === "declined").length;
  const invite_dispatched = opened + accepted + declined;

  return NextResponse.json({
    total,
    sent,
    opened,
    accepted,
    declined,
    invite_dispatched,
    openRate: total ? ((opened / total) * 100).toFixed(1) : "0",
    acceptRate: total ? ((accepted / total) * 100).toFixed(1) : "0",
  });
}
