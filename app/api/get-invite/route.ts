import { NextResponse } from "next/server";
import {
  loadPublicCoworkerInvitePreview,
  sanitizeInviteToken,
  touchCoworkerInviteOpened,
} from "@/lib/invites/publicCoworkerVouch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/get-invite?token=...
 *
 * WorkVouch equivalent of:
 * - `invites` + `token` → **`coworker_invites`** + **`invite_token`**
 * - `status: "opened"` → **`invite_opened_at`** (timestamp; row stays **`pending`** until accept/decline)
 * - Uses **`admin`** (not browser `supabase`) per API route rules
 *
 * Response is a **safe subset** (not `select("*")`) for the public confirm UI.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = sanitizeInviteToken(url.searchParams.get("token"));
  if (!token) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const just_opened = await touchCoworkerInviteOpened(token);
  const preview = await loadPublicCoworkerInvitePreview(token);

  if (!preview.ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    user_name: preview.inviterName,
    company: preview.companyName,
    token,
    status: preview.status,
    /** True if this request was the first “open” (we set `invite_opened_at`). */
    just_opened: just_opened,
  });
}
