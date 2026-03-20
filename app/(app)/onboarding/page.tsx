import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { isImpersonating } from "@/lib/auth/isImpersonating";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import { getDashboardHomeData } from "@/lib/actions/dashboard/getDashboardHome";
import { isGuidedProfileComplete } from "@/lib/onboarding/guidedOnboarding";
import { GuidedOnboardingClient } from "@/components/onboarding/GuidedOnboardingClient";

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

  const stats = {
    jobsCount: data.jobsCount,
    matchesCount: data.matchesCount,
    referenceCount: data.referenceCount,
  };

  if (isGuidedProfileComplete(stats)) {
    redirect("/dashboard");
  }

  return (
    <GuidedOnboardingClient
      stats={stats}
      firstName={data.firstName}
    />
  );
}
