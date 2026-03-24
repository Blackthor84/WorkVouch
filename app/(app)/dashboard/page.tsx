import { getUser } from "@/lib/auth/getUser";
import { getDashboardHomeData } from "@/lib/actions/dashboard/getDashboardHome";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { DashboardOnboardingCard } from "@/components/dashboard/DashboardOnboardingCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { MatchPreview } from "@/components/dashboard/MatchPreview";
import { DashboardProfileStrength } from "@/components/dashboard/DashboardProfileStrength";
import { CoworkerGrowthBanner } from "@/components/dashboard/CoworkerGrowthBanner";
import { OnboardingIncompleteBanner } from "@/components/dashboard/OnboardingIncompleteBanner";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { DashboardTrustSeenMark } from "@/components/dashboard/DashboardTrustSeenMark";
import { InviteSentFeedback } from "@/components/dashboard/InviteSentFeedback";
import { SmartOnboardingNudges } from "@/components/dashboard/SmartOnboardingNudges";
import { isGuidedProfileComplete } from "@/lib/onboarding/guidedOnboarding";
import { UserGroupIcon, ChatBubbleLeftRightIcon, BriefcaseIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function UserDashboardPage() {
  const user = await getUser();
  if (!user) return null;

  const data = await getDashboardHomeData();
  if (!data) return null;

  const hasReputationSignal = data.trustScore > 0 || data.referenceCount > 0;
  const guidedStats = {
    jobsCount: data.jobsCount,
    matchesCount: data.matchesCount,
    referenceCount: data.referenceCount,
  };
  const showOnboardingBanner = !isGuidedProfileComplete(guidedStats);

  return (
    <div className="flex-1 w-full bg-gray-50 pb-8 dark:bg-gray-950">
      <DashboardTrustSeenMark />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <DashboardHeader
            firstName={data.firstName}
            trustScore={data.trustScore}
            verifiedByCoworkers={data.verifiedByCoworkers}
            isNewUser={data.isNewUser}
          />
          <InviteSentFeedback show={false} />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            People in your area are already getting verified
          </div>
        </div>

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

        <CoworkerGrowthBanner matchesCount={data.matchesCount} />

        <DashboardQuickActions />

        <section aria-label="Stats overview" className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Matches"
              value={data.matchesCount}
              icon={<UserGroupIcon className="h-6 w-6" />}
            />
            <StatCard
              label="Reviews"
              value={data.referenceCount}
              icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />}
            />
            <StatCard
              label="Jobs"
              value={data.jobsCount}
              icon={<BriefcaseIcon className="h-6 w-6" />}
            />
            <StatCard
              label="Trust score"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <StarIcon className="h-7 w-7 text-amber-500 shrink-0" aria-hidden />
                  {data.trustScore}
                </span>
              }
            />
          </div>
        </section>

        <section aria-label="Recent activity and matches" className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent activity</h2>
            <ActivityFeed items={data.activities} />
          </div>
          <div className="flex flex-col gap-8">
            <MatchPreview matches={data.matchesPreview} />
            <DashboardProfileStrength percent={data.profileStrengthPct} />
          </div>
        </section>
      </div>
    </div>
  );
}
