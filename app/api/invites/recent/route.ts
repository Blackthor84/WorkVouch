import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/getUser";
import { findRecentInvites } from "@/lib/invites/coworkerVouchInviteStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/invites/recent
 * Recent coworker-vouch invites for the signed-in user (public.invites).
 */
export async function GET() {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invites, error } = await findRecentInvites(user.id, 10);

  if (error) {
    return NextResponse.json({ error: error.message ?? "Could not load recent invites" }, { status: 500 });
  }

  const recent = invites.map((row) => ({
    contact: row.contact || row.email || row.phone || "(no contact)",
    status: row.status ?? "pending",
    created_at: row.created_at,
  }));

  return NextResponse.json({ recent });
}
