import { getUser } from "@/lib/auth/getUser";
import { getDashboardHomeData } from "@/lib/actions/dashboard/getDashboardHome";
import { DashboardOnboardingCard } from "@/components/dashboard/DashboardOnboardingCard";
import { OnboardingIncompleteBanner } from "@/components/dashboard/OnboardingIncompleteBanner";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { DashboardTrustSeenMark } from "@/components/dashboard/DashboardTrustSeenMark";
import { InviteSentFeedback } from "@/components/dashboard/InviteSentFeedback";
import { SmartOnboardingNudges } from "@/components/dashboard/SmartOnboardingNudges";
import { DashboardReputationHero } from "@/components/dashboard/DashboardReputationHero";
import { DashboardStatsGrid } from "@/components/dashboard/DashboardStatsGrid";
import { DashboardMatchesSection } from "@/components/dashboard/DashboardMatchesSection";
import { DashboardBoostSection } from "@/components/dashboard/DashboardBoostSection";
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
    <div className="flex-1 w-full bg-slate-50/80 pb-12 dark:bg-slate-950">
      <DashboardTrustSeenMark />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <OnboardingIncompleteBanner show={showOnboardingBanner} />

        {showOnboardingBanner && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <OnboardingChecklist
              jobsCount={data.jobsCount}
              matchesCount={data.matchesCount}
              referenceCount={data.referenceCount}
              profileBasicsComplete={data.profileBasicsComplete}
              verifiedByCoworkers={data.verifiedByCoworkers}
            />
            <SmartOnboardingNudges
              jobsCount={data.jobsCount}
              referenceCount={data.referenceCount}
              verifiedByCoworkers={data.verifiedByCoworkers}
              matchesCount={data.matchesCount}
              profileStrengthPct={data.profileStrengthPct}
            />
          </div>
        )}

        {data.isNewUser && <DashboardOnboardingCard />}

        <div className="space-y-2">
          <DashboardReputationHero
            trustScore={data.trustScore}
            verificationsThisMonth={data.verificationsThisMonth}
          />
          <InviteSentFeedback show={false} />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            People in your area are already getting verified
          </p>
        </div>

        <DashboardStatsGrid
          verifiedReferences={data.referenceCount}
          coworkerMatches={data.matchesCount}
          completedJobs={data.verifiedJobsCount}
          pendingRequests={data.pendingRequestsCount}
        />

        <DashboardMatchesSection matches={data.matchesPreview} />

        <DashboardBoostSection />
      </div>
    </div>
  );
}
