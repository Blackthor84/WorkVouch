import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export type OnboardingFlow = "employer" | "worker";

export interface OnboardingStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
}

const EMPLOYER_STEPS: OnboardingStep[] = [
  { id: "profile", targetId: "onboarding-company-profile", title: "Complete company profile", description: "Add your company name and details so candidates can find you." },
  { id: "team", targetId: "onboarding-add-team", title: "Add first team member", description: "Invite a colleague to your employer account to collaborate on hiring." },
  { id: "verification", targetId: "onboarding-request-verification", title: "Request verification", description: "Request a verification for a candidate to see their verified work history." },
  { id: "analytics", targetId: "onboarding-analytics", title: "View analytics dashboard", description: "See rehire probability, trust scores, and workforce insights." },
];

const WORKER_STEPS: OnboardingStep[] = [
  { id: "profile", targetId: "onboarding-profile", title: "Complete your profile", description: "Add your name, industry, and summary so employers can find you." },
  { id: "job", targetId: "onboarding-add-job", title: "Add your first job", description: "Add a job or upload your resume to build your verified work history." },
  { id: "coworker", targetId: "onboarding-invite-coworker", title: "Invite a coworker", description: "Connect with a coworker to get references and strengthen your profile." },
  { id: "trust", targetId: "onboarding-trust-score", title: "View your trust score", description: "Your trust score shows employers your verified reputation at a glance." },
];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ showOnboarding: false });
    }

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;

    // Check profile (onboarding_completed column may not exist yet)
    const { data: profile } = await supabaseAny
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const onboardingCompleted = (profile as any)?.onboarding_completed === true;
    if (onboardingCompleted) {
      return NextResponse.json({ showOnboarding: false, completed: true });
    }

    const isEmployer = await hasRole("employer");

    if (isEmployer) {
      const { data: employerAccount } = await supabaseAny
        .from("employer_accounts")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const employerId = (employerAccount as any)?.id;
      let verificationCount = 0;
      if (employerId) {
        const res = await supabaseAny
          .from("verification_requests")
          .select("*", { count: "exact", head: true })
          .eq("requested_by_id", employerId)
          .eq("requested_by_type", "employer");
        verificationCount = (res as { count?: number })?.count ?? 0;
      }

      const seatsUsed = (employerAccount as any)?.seats_used ?? (employerAccount as any)?.seats_allowed ?? 1;
      const hasVerifications = verificationCount > 0;
      const hasSeats = Number(seatsUsed) > 0;

      const showOnboarding = !hasVerifications || !hasSeats;
      return NextResponse.json({
        showOnboarding,
        flow: "employer",
        steps: EMPLOYER_STEPS,
        completed: false,
      });
    }

    // Worker: check jobs count and profile completeness
    const { count: jobsCount } = await supabaseAny
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const profileComplete = Boolean((profile as any)?.full_name?.trim() && (profile as any)?.industry?.trim());
    const hasJobs = (jobsCount ?? 0) > 0;

    const showOnboarding = !profileComplete || !hasJobs;
    return NextResponse.json({
      showOnboarding,
      flow: "worker",
      steps: WORKER_STEPS,
      completed: false,
    });
  } catch (e) {
    console.error("[onboarding/status]", e);
    return NextResponse.json({ showOnboarding: false });
  }
}
