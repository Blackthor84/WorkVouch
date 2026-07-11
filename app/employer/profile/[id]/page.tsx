import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getCandidateProfileForEmployer } from "@/lib/actions/employer/candidate-search";
import { getPublicProfile } from "@/lib/actions/employer";
import {
  requireEmployerLegalAcceptance,
  EMPLOYER_DISCLAIMER_NOT_ACCEPTED,
} from "@/lib/employer/requireEmployerLegalAcceptance";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { CandidateProfileViewer } from "@/components/employer/candidate-profile-viewer";
import { PublicProfileView } from "@/components/public-profile-view";
import { EmployerLegalDisclaimerGate } from "@/components/employer/EmployerLegalDisclaimerGate";
import { EmployerProfilePaywall } from "@/components/employer/EmployerProfilePaywall";
import {
  canViewCandidateProfile,
  recordCandidateProfileView,
  isEmployerHiringPremium,
} from "@/lib/actions/employer/employerDashboardStats";

export default async function EmployerCandidateProfilePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isEmployer = await hasRole("employer");

  if (!isEmployer) {
    redirect("/dashboard");
  }

  const access = await canViewCandidateProfile(id);
  const supabase = await createClient();
  const { data: employerProfileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const employerRole = (employerProfileRow as { role?: string } | null)?.role ?? null;
  const legalFirst = await requireEmployerLegalAcceptance(user.id, employerRole);
  if (!legalFirst.allowed) {
    return (
      <EmployerPortalLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <EmployerLegalDisclaimerGate redirectPath={`/employer/profile/${id}`} />
        </div>
      </EmployerPortalLayout>
    );
  }

  if (!access.allowed) {
    return (
      <EmployerPortalLayout>
        <EmployerProfilePaywall viewsToday={access.viewsToday} limit={access.limit} />
      </EmployerPortalLayout>
    );
  }

  await recordCandidateProfileView(id);
  const hiringDataUnlocked = await isEmployerHiringPremium();

  let candidateData;
  try {
    candidateData = await getCandidateProfileForEmployer(id);

    return (
      <EmployerPortalLayout>
        <CandidateProfileViewer
          candidateData={candidateData}
          hiringDataUnlocked={candidateData.hiringDataUnlocked && hiringDataUnlocked}
        />
      </EmployerPortalLayout>
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === EMPLOYER_DISCLAIMER_NOT_ACCEPTED) {
      return (
        <EmployerPortalLayout>
          <div className="flex min-h-[50vh] items-center justify-center">
            <EmployerLegalDisclaimerGate redirectPath={`/employer/profile/${id}`} />
          </div>
        </EmployerPortalLayout>
      );
    }
    // Fallback to public profile view
    try {
      const profileData = await getPublicProfile(id);

      return (
        <EmployerPortalLayout>
          <PublicProfileView profileData={profileData} />
        </EmployerPortalLayout>
      );
    } catch (fallbackError: unknown) {
      return (
        <EmployerPortalLayout>
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-wv-foreground mb-2">Profile Not Found</h1>
            <p className="text-wv-muted">This profile could not be loaded.</p>
          </div>
        </EmployerPortalLayout>
      );
    }
  }
}
