import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getUser } from "@/lib/auth/getUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  status: string;
  invite_sent_at: string | null;
  invite_opened_at: string | null;
};

/**
 * GET /api/invites/stats
 *
 * Same idea as aggregating `invites` by status — WorkVouch uses **`coworker_invites`**:
 * - **opened** = `invite_opened_at` set (there is no `status = 'opened'`)
 * - **sent** (compat) = count still **`pending`** (matches your `status === 'pending'` filter)
 *
 * Scoped to the **signed-in user** as `sender_id` (never returns other users’ rows).
 * Uses **admin** client for reads (API route rule); auth gates access.
 */
export async function GET() {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: rows, error } = await admin
    .from("coworker_invites")
    .select("status, invite_sent_at, invite_opened_at")
    .eq("sender_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const invites = (rows ?? []) as Row[];
  const total = invites.length;
  const sent = invites.filter((i) => i.status === "pending").length;
  const opened = invites.filter((i) => i.invite_opened_at != null).length;
  const accepted = invites.filter((i) => i.status === "accepted").length;
  const declined = invites.filter((i) => i.status === "declined").length;
  const invite_dispatched = invites.filter((i) => i.invite_sent_at != null).length;

  return NextResponse.json({
    total,
    sent,
    opened,
    accepted,
    declined,
    /** Rows where email/SMS was actually sent (`invite_sent_at`) */
    invite_dispatched,
    openRate: total ? ((opened / total) * 100).toFixed(1) : "0",
    acceptRate: total ? ((accepted / total) * 100).toFixed(1) : "0",
  });
}
