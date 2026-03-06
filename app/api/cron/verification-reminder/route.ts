/**
 * Cron: send SMS reminders for pending verification requests older than 24h.
 * Call with Authorization: Bearer CRON_SECRET or x-cron-secret header.
 * In sandbox, no SMS is sent (sendVerificationSms no-ops).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { sendVerificationSms } from "@/lib/sms/sendSms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REMINDER_AGE_HOURS = 24;

export async function GET(req: NextRequest) {
  const secret =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    req.headers.get("x-cron-secret") ??
    "";
  const cronSecret = process.env.CRON_SECRET ?? process.env.CRON_VERIFICATION_REMINDER_SECRET;
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  const since = new Date(Date.now() - REMINDER_AGE_HOURS * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from("verification_requests")
    .select("id, phone_number, response_token, requester_profile_id, reminder_sent_at")
    .eq("status", "pending")
    .not("phone_number", "is", null)
    .lt("created_at", since)
    .is("reminder_sent_at", null);

  if (error) {
    console.error("[cron/verification-reminder]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (rows ?? []) as Array<{
    id: string;
    phone_number: string;
    response_token: string;
    requester_profile_id: string;
  }>;

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://app.workvouch.com";

  let sent = 0;
  for (const row of list) {
    const link = `${baseUrl}/verify/${row.response_token}`;
    const result = await sendVerificationSms(
      row.phone_number,
      link,
      "WorkVouch"
    );
    if (result.ok) {
      await supabase
        .from("verification_requests")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", row.id);
      sent++;
    }
  }

  return NextResponse.json({
    ok: true,
    pending_count: list.length,
    reminders_sent: sent,
  });
}
