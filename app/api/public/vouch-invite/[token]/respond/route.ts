import { NextResponse } from "next/server";
import { respondToPublicCoworkerInvite, sanitizeInviteToken } from "@/lib/invites/publicCoworkerVouch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/public/vouch-invite/[token]/respond
 * Body: { decision: "yes" | "no" }
 */
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token: raw } = await ctx.params;
  const token = sanitizeInviteToken(raw);
  if (!token) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const decision = body.decision === "yes" || body.decision === "no" ? body.decision : null;
  if (!decision) {
    return NextResponse.json({ ok: false, error: "decision_required" }, { status: 400 });
  }

  const result = await respondToPublicCoworkerInvite(token, decision);

  if (!result.ok) {
    const status =
      result.error === "not_found" ? 404 : result.error === "already_resolved" ? 409 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, status: result.status });
}
