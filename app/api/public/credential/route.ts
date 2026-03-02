/**
 * GET /api/public/credential?token=<share_token>
 * Public, no login. Read-only, verifiable credential view by share token.
 * Time-limited and revoke-checked. Audit view with viewer_id null for link context.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token || typeof token !== "string" || token.length < 10) {
      return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 });
    }

    const admin = getSupabaseServer();

    const { data: cred, error } = await admin
      .from("workvouch_credentials")
      .select("id, payload, visibility, issued_at, expires_at, revoked_at")
      .eq("share_token", token)
      .is("revoked_at", null)
      .maybeSingle();

    if (error) {
      console.error("[public/credential]", error);
      return NextResponse.json({ error: "Credential unavailable" }, { status: 500 });
    }

    if (!cred) {
      return NextResponse.json({ error: "Credential not found or revoked" }, { status: 404 });
    }

    const c = cred as { expires_at: string | null };
    if (c.expires_at && new Date(c.expires_at) < new Date()) {
      return NextResponse.json({ error: "Credential link has expired" }, { status: 410 });
    }

    await admin.from("credential_views_audit").insert({
      workvouch_credential_id: (cred as { id: string }).id,
      viewer_id: null,
      viewer_employer_id: null,
      context: "link",
      job_application_id: null,
    });

    const out = cred as { id: string; payload: unknown; visibility: string; issued_at: string; expires_at: string | null };
    return NextResponse.json({
      credential: {
        id: out.id,
        payload: out.payload,
        visibility: out.visibility,
        issued_at: out.issued_at,
        expires_at: out.expires_at,
      },
      readOnly: true,
    });
  } catch (e) {
    console.error("[public/credential]", e);
    return NextResponse.json({ error: "Credential unavailable" }, { status: 500 });
  }
}
