/**
 * GET /api/cron/worker-onboarding-reminders
 * Send in-app notifications for users who have not finished the vouch loop.
 * Auth: Authorization: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import {
  ONBOARDING_NUDGE_MESSAGES,
  shouldSkipOnboardingNudge,
  type OnboardingReminderKind,
} from "@/lib/onboarding/workerOnboardingNudges";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();

  const { data: due, error } = await admin
    .from("worker_onboarding_reminder_queue")
    .select("id, user_id, reminder_kind")
    .lte("run_after", now)
    .is("sent_at", null)
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let processed = 0;

  for (const row of due ?? []) {
    const r = row as { id: string; user_id: string; reminder_kind: string };
    const { data: prof } = await admin
      .from("profiles")
      .select("worker_onboarding_loop_completed_at, role")
      .eq("id", r.user_id)
      .maybeSingle();

    const p = prof as { worker_onboarding_loop_completed_at?: string | null; role?: string | null } | null;
    const role = String(p?.role ?? "").toLowerCase();
    if (role === "employer" || p?.worker_onboarding_loop_completed_at) {
      await admin.from("worker_onboarding_reminder_queue").update({ sent_at: now }).eq("id", r.id);
      processed++;
      continue;
    }

    const { count: inviteCount } = await admin
      .from("coworker_invites")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", r.user_id);

    const hasInvite = (inviteCount ?? 0) > 0;
    if (shouldSkipOnboardingNudge(hasInvite)) {
      await admin.from("worker_onboarding_reminder_queue").update({ sent_at: now }).eq("id", r.id);
      processed++;
      continue;
    }

    const kind = r.reminder_kind as OnboardingReminderKind;
    const copy = ONBOARDING_NUDGE_MESSAGES[kind] ?? ONBOARDING_NUDGE_MESSAGES["24h"];

    await admin.from("notifications").insert({
      user_id: r.user_id,
      type: "onboarding_reminder",
      title: copy.title,
      message: copy.message,
    });

    await admin.from("worker_onboarding_reminder_queue").update({ sent_at: now }).eq("id", r.id);
    processed++;
  }

  return NextResponse.json({ ok: true, processed });
}
