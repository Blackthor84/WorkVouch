import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getUser } from "@/lib/auth/getUser";
import { onboardingReminderRows } from "@/lib/onboarding/workerOnboardingNudges";
import { getStatus, type VouchStatusSlug } from "@/lib/onboarding/vouchOnboarding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensureReminderQueue(userId: string, profileCreatedAt: string | null) {
  const { data: anyRow } = await admin
    .from("worker_onboarding_reminder_queue")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (anyRow) return;

  const rows = onboardingReminderRows(userId, profileCreatedAt);
  await admin.from("worker_onboarding_reminder_queue").insert(rows);
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: roleRow } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (String((roleRow as { role?: string } | null)?.role ?? "").toLowerCase() === "employer") {
      return NextResponse.json({ error: "Not for employer accounts" }, { status: 403 });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("worker_onboarding_loop_completed_at, created_at, vouch_count, vouch_tier")
      .eq("id", user.id)
      .maybeSingle();

    const prof = profile as {
      worker_onboarding_loop_completed_at?: string | null;
      created_at?: string;
      vouch_count?: number;
      vouch_tier?: number;
      vouch_status?: string | null;
    } | null;

    const completed = Boolean(prof?.worker_onboarding_loop_completed_at);

    if (!completed) {
      await ensureReminderQueue(user.id, prof?.created_at ?? null);
    }

    const { data: jobRow } = await admin
      .from("jobs")
      .select("id, company_name, job_title, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const job = jobRow as {
      id: string;
      company_name: string;
      job_title: string | null;
      title: string | null;
    } | null;

    const { data: contactRows } = await admin
      .from("worker_onboarding_contacts")
      .select("position, display_name, email, phone, coworker_invite_id")
      .eq("user_id", user.id)
      .order("position", { ascending: true });

    const contacts = (contactRows ?? []) as Array<{
      position: number;
      display_name: string;
      email: string | null;
      phone: string | null;
      coworker_invite_id: string | null;
    }>;

    const { count: invitesCount } = await admin
      .from("coworker_invites")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", user.id);

    const invitesSentCount = invitesCount ?? 0;
    const hasJob = Boolean(job?.id);
    const contactsCount = contacts.length;
    const hasEmailContact = contacts.some((c) => (c.email ?? "").trim().length > 0);
    const anyInviteLinked = contacts.some((c) => c.coworker_invite_id != null);
    const sendStepDone =
      anyInviteLinked || (contactsCount >= 1 && !hasEmailContact);
    const canComplete = hasJob && (contactsCount >= 1 || invitesSentCount >= 1);

    let step = 1;
    if (!hasJob) step = 2;
    else if (contactsCount < 1) step = 3;
    else if (hasEmailContact && !anyInviteLinked && invitesSentCount < 1) step = 4;
    else step = 5;

    return NextResponse.json({
      step,
      hasJob,
      job: job
        ? {
            id: job.id,
            company_name: job.company_name,
            job_title: job.job_title ?? job.title,
          }
        : null,
      contacts: contacts.map((c) => ({
        position: c.position,
        display_name: c.display_name,
        email: c.email,
        phone: c.phone,
        inviteSent: c.coworker_invite_id != null,
      })),
      invitesSentCount,
      vouchCount,
      vouchTier: Number(prof?.vouch_tier ?? 0),
      vouchStatus,
      completed,
      canComplete,
      sendStepDone,
    });
  } catch (e) {
    console.error("[onboarding/vouch/state]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
