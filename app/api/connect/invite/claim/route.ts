import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/getUser";
import { claimConnectCandidateInvite } from "@/lib/employer/candidates/candidate-invite-service";
import {
  inviteEmailsMatch,
  loadConnectInviteCandidateEmail,
  resolveConnectCandidateInvitePreview,
  sanitizeConnectInviteToken,
} from "@/lib/integrations/connect/invitations/resolve-connect-invite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/connect/invite/claim
 * Authenticated candidate claims a Connect invitation using the raw email token.
 */
export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user?.id || !user.email) {
      return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const token = sanitizeConnectInviteToken(
      typeof body.token === "string" ? body.token : undefined
    );
    if (!token) {
      return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 400 });
    }

    const preview = await resolveConnectCandidateInvitePreview(token, { profileId: user.id });
    if (!preview.ok) {
      return NextResponse.json({ ok: false, error: preview.state }, { status: 400 });
    }

    if (preview.state === "claimed" || preview.state === "already_connected") {
      if (preview.claimedByCurrentUser) {
        return NextResponse.json({
          ok: true,
          alreadyClaimed: true,
          profileId: user.id,
        });
      }
      return NextResponse.json({ ok: false, error: "already_claimed" }, { status: 409 });
    }

    const inviteEmail = await loadConnectInviteCandidateEmail(token);
    if (!inviteEmail || !inviteEmailsMatch(inviteEmail, user.email)) {
      return NextResponse.json({ ok: false, error: "email_mismatch" }, { status: 403 });
    }

    const result = await claimConnectCandidateInvite(token, user.id);
    if (!result.ok) {
      const status =
        result.code === "already_claimed"
          ? 409
          : result.code === "expired"
            ? 410
            : result.code === "not_found"
              ? 404
              : 400;
      return NextResponse.json({ ok: false, error: result.code ?? "claim_failed" }, { status });
    }

    return NextResponse.json({
      ok: true,
      profileId: result.profileId,
      connectCandidateMapId: result.connectCandidateMapId,
      alreadyClaimed: result.alreadyClaimed ?? false,
    });
  } catch (error) {
    console.error("[connect/invite/claim]", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
