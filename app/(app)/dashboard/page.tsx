import { Suspense } from "react";
import { getUser } from "@/lib/auth/getUser";
import { getDashboardHomeData } from "@/lib/actions/dashboard/getDashboardHome";
import { DashboardOnboardingCard } from "@/components/dashboard/DashboardOnboardingCard";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { DashboardTrustSeenMark } from "@/components/dashboard/DashboardTrustSeenMark";
import { InviteSentFeedback } from "@/components/dashboard/InviteSentFeedback";
import { DashboardReputationHero } from "@/components/dashboard/DashboardReputationHero";
import { DashboardStatsGrid } from "@/components/dashboard/DashboardStatsGrid";
import { DashboardMatchesSection } from "@/components/dashboard/DashboardMatchesSection";
import { DashboardBoostSection } from "@/components/dashboard/DashboardBoostSection";
import { DashboardActivitySection } from "@/components/dashboard/DashboardActivitySection";
import { DashboardHomeClient } from "@/components/dashboard/DashboardHomeClient";
import { BadHireCostFromCalculatorBanner } from "@/components/dashboard/BadHireCostFromCalculatorBanner";
import { isGuidedProfileComplete } from "@/lib/onboarding/guidedOnboarding";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function UserDashboardPage() {
  const user = await getUser();
  if (!user) return null;

  const data = await getDashboardHomeData();
  if (!data) return null;

  const guidedStats = {
    jobsCount: data.jobsCount,
    matchesCount: data.matchesCount,
    referenceCount: data.referenceCount,
  };
  const showOnboardingBanner = !isGuidedProfileComplete(guidedStats);

  return (
    <div className="flex-1 w-full bg-wv-bg pb-12">
      <DashboardTrustSeenMark />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <BadHireCostFromCalculatorBanner />

        {showOnboardingBanner && (
          <OnboardingChecklist
            jobsCount={data.jobsCount}
            matchesCount={data.matchesCount}
            referenceCount={data.referenceCount}
            profileBasicsComplete={data.profileBasicsComplete}
            verifiedByCoworkers={data.verifiedByCoworkers}
          />
        )}

        {data.isNewUser && showOnboardingBanner && <DashboardOnboardingCard />}

        <div className="space-y-2">
          <DashboardReputationHero
            trustScore={data.trustScore}
            verificationsThisMonth={data.verificationsThisMonth}
          />
          <InviteSentFeedback show={false} />
          <p className="text-xs text-wv-subtle">
            People in your area are already getting verified
          </p>
        </div>

        <Suspense fallback={null}>
          <DashboardHomeClient publicSlug={data.publicSlug} />
        </Suspense>

        <DashboardStatsGrid
          verifiedReferences={data.referenceCount}
          coworkerMatches={data.matchesCount}
          completedJobs={data.verifiedJobsCount}
          pendingRequests={data.pendingRequestsCount}
        />

        <DashboardMatchesSection matches={data.matchesPreview} />

        <DashboardActivitySection activities={data.activities} />

        <DashboardBoostSection />
      </div>
    </div>
  );
}
