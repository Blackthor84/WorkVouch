import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getUser } from "@/lib/auth/getUser";
import { onboardingReminderRows } from "@/lib/onboarding/workerOnboardingNudges";
import { getStatus, type VouchStatusSlug } from "@/lib/onboarding/vouchOnboarding";
import { isGuidedProfileComplete } from "@/lib/onboarding/guidedOnboarding";
import { loadOnboardingProfileFields } from "@/lib/onboarding/onboardingProfileFields";
import { loadOnboardingContacts } from "@/lib/onboarding/productionSafeOnboardingContacts";
import { isMissingTableError } from "@/lib/supabase/postgrestErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensureReminderQueue(userId: string, profileCreatedAt: string | null) {
  const { data: anyRow, error: readError } = await admin
    .from("worker_onboarding_reminder_queue")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (readError) {
    if (isMissingTableError(readError)) return;
    throw new Error(readError.message ?? "Failed to read onboarding reminder queue");
  }

  if (anyRow) return;

  const rows = onboardingReminderRows(userId, profileCreatedAt);
  const { error: insertError } = await admin.from("worker_onboarding_reminder_queue").insert(rows);
  if (insertError && !isMissingTableError(insertError)) {
    throw new Error(insertError.message ?? "Failed to seed onboarding reminder queue");
  }
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

    const profileFields = await loadOnboardingProfileFields(user.id);
    const completed = Boolean(profileFields.workerOnboardingLoopCompletedAt);

    if (!completed) {
      await ensureReminderQueue(user.id, profileFields.createdAt);
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

    const { contacts, error: contactsError } = await loadOnboardingContacts(user.id);

    if (contactsError && !isMissingTableError(contactsError)) {
      throw new Error(contactsError.message ?? "Failed to load onboarding contacts");
    }

    const { count: invitesCount } = await admin
      .from("coworker_invites")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", user.id);

    const { count: matchesCount } = await admin
      .from("coworker_matches")
      .select("id", { count: "exact", head: true })
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    const { count: jobCount } = await admin
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { data: trustRow, error: trustError } = await admin
      .from("trust_scores")
      .select("reference_count")
      .eq("user_id", user.id)
      .maybeSingle();

    const referenceCount =
      trustError && isMissingTableError(trustError)
        ? 0
        : Number((trustRow as { reference_count?: number } | null)?.reference_count ?? 0);

    if (trustError && !isMissingTableError(trustError)) {
      throw new Error(trustError.message ?? "Failed to load trust scores");
    }

    const vouchCount = profileFields.vouchCount;
    const vouchStatus: VouchStatusSlug = getStatus(vouchCount);

    const guidedComplete = isGuidedProfileComplete({
      jobsCount: jobCount ?? 0,
      matchesCount: matchesCount ?? 0,
      referenceCount,
    });
    const bioLen = profileFields.professionalSummary.trim().length;
    const profileBasicsComplete = bioLen >= 20;

    const invitesSentCount = invitesCount ?? 0;
    const hasJob = Boolean(job?.id);
    const contactsCount = contacts.length;
    const hasEmailContact = contacts.some((c) => (c.email ?? "").trim().length > 0);
    const anyInviteLinked = contacts.some((c) => c.coworker_invite_id != null);
    const sendStepDone = anyInviteLinked || (contactsCount >= 1 && !hasEmailContact);
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
      vouchTier: profileFields.vouchTier,
      vouchStatus,
      completed,
      canComplete,
      sendStepDone,
      industry: profileFields.industry,
      professionalSummary: profileFields.professionalSummary,
      verticalMetadata: profileFields.verticalMetadata,
      profileBasicsComplete,
      guidedComplete,
      jobsCount: jobCount ?? 0,
      matchesCount: matchesCount ?? 0,
      referenceCount,
    });
  } catch (e) {
    console.error("[onboarding/vouch/state]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
