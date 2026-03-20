import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeCompany(name: string | undefined | null): string | null {
  const t = (name ?? "").trim().toLowerCase();
  return t.length ? t : null;
}

/**
 * POST /api/invites/coworker
 * Body: { email: string, company_name?: string, job_id?: string }
 * Creates a pending coworker_invite with shareable token for /signup?invite=TOKEN
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const emailRaw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!emailRaw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    if (emailRaw === (user.email ?? "").toLowerCase()) {
      return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
    }

    const company_normalized = normalizeCompany(body.company_name);
    const job_id = typeof body.job_id === "string" && body.job_id.length >= 30 ? body.job_id : null;

    if (job_id) {
      const { data: job } = await admin.from("jobs").select("id, user_id").eq("id", job_id).maybeSingle();
      if (!job || (job as { user_id: string }).user_id !== user.id) {
        return NextResponse.json({ error: "Invalid job" }, { status: 400 });
      }
    }

    const invite_token = randomBytes(18).toString("base64url");

    const { data: row, error } = await admin
      .from("coworker_invites")
      .insert({
        sender_id: user.id,
        email: emailRaw,
        invite_token,
        status: "pending",
        company_normalized,
        job_id,
      })
      .select("id, invite_token")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already invited this email" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || "";
    const origin = base || new URL(req.url).origin;
    const inviteUrl = `${origin.replace(/\/$/, "")}/signup?invite=${encodeURIComponent((row as { invite_token: string }).invite_token)}`;

    return NextResponse.json({
      ok: true,
      invite_token: (row as { invite_token: string }).invite_token,
      inviteUrl,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
