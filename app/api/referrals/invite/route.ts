import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/referrals/invite
 * Body: { email: string }
 * Inserts a referral for the current user. Email sending can be done via
 * Database Webhook → Edge Function on referrals INSERT.
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
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const { error } = await admin.from("referrals").insert({
      referrer_id: user.id,
      referred_email: email,
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already invited" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
