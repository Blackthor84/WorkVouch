import { NextResponse } from "next/server";
import { acceptInvite, declineInvite } from "@/lib/invites/acceptInvite";
import { sanitizeInviteToken } from "@/lib/invites/publicCoworkerVouch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/accept-invite
 * Body: { token: string, decision?: "yes" | "no" } — omitting decision defaults to "yes"
 * (matches minimal `{ token }` from a "Yes" button.)
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = sanitizeInviteToken(typeof body.token === "string" ? body.token : "");
  if (!token) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 400 });
  }

  let decision: "yes" | "no" = "yes";
  const d = body.decision;
  if (d === "no" || d === false || d === "false") decision = "no";
  else if (d === "yes" || d === true) decision = "yes";

  const result = decision === "yes" ? await acceptInvite(token) : await declineInvite(token);

  if (!result.ok) {
    const status =
      result.error === "not_found" ? 404 : result.error === "already_resolved" ? 409 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, status: result.status });
}
