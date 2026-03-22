import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { isImpersonating } from "@/lib/auth/isImpersonating";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import { getDashboardHomeData } from "@/lib/actions/dashboard/getDashboardHome";
import { isGuidedProfileComplete } from "@/lib/onboarding/guidedOnboarding";
import { needsWorkerVouchOnboarding } from "@/lib/onboarding/needsVouchOnboarding";
import { GuidedOnboardingClient } from "@/components/onboarding/GuidedOnboardingClient";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { VouchOnboardingWizard } from "@/components/onboarding/VouchOnboardingWizard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Guided onboarding — 3 steps: job, coworkers, first review.
 * Completed users are sent to the dashboard.
 */
export default async function OnboardingPage() {
  const admin = await getAdminContext();
  if (admin.isAdmin && !(await isImpersonating())) {
    redirect("/admin");
  }

  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: profileRow } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = ((profileRow as { role?: string } | null)?.role ?? "").toLowerCase();
  if (role === "employer") {
    redirect("/employer");
  }

  const data = await getDashboardHomeData();
  if (!data) {
    redirect("/login");
  }

  const needsVouch = await needsWorkerVouchOnboarding(user.id);
  if (needsVouch) {
    return <VouchOnboardingWizard firstName={data.firstName} />;
  }

  const stats = {
    jobsCount: data.jobsCount,
    matchesCount: data.matchesCount,
    referenceCount: data.referenceCount,
  };

  if (isGuidedProfileComplete(stats)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 pb-12">
      <div className="max-w-2xl mx-auto px-4 pt-6 sm:pt-8">
        <OnboardingChecklist
          jobsCount={data.jobsCount}
          matchesCount={data.matchesCount}
          referenceCount={data.referenceCount}
          profileBasicsComplete={data.profileBasicsComplete}
          verifiedByCoworkers={data.verifiedByCoworkers}
          variant="compact"
        />
      </div>
      <GuidedOnboardingClient
        stats={stats}
        firstName={data.firstName}
        profileBasicsComplete={data.profileBasicsComplete}
        verifiedByCoworkers={data.verifiedByCoworkers}
      />
    </div>
  );
}
