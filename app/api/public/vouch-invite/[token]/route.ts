import { NextResponse } from "next/server";
import {
  loadPublicCoworkerInvitePreview,
  sanitizeInviteToken,
  touchCoworkerInviteOpened,
} from "@/lib/invites/publicCoworkerVouch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/public/vouch-invite/[token]
 * Public preview for confirm page; records invite_opened_at once (pending only).
 */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token: raw } = await ctx.params;
  const token = sanitizeInviteToken(raw);
  if (!token) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 400 });
  }

  await touchCoworkerInviteOpened(token);
  const preview = await loadPublicCoworkerInvitePreview(token);

  if (!preview.ok) {
    return NextResponse.json({ ok: false, error: preview.error }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    inviterName: preview.inviterName,
    companyName: preview.companyName,
    status: preview.status,
  });
}
