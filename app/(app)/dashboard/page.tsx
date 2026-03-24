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
    <div className="flex-1 w-full bg-slate-50/80 dark:bg-slate-950 pb-12">
      <DashboardTrustSeenMark />
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <DashboardHeader
          firstName={data.firstName}
          trustScore={data.trustScore}
          verifiedByCoworkers={data.verifiedByCoworkers}
          isNewUser={data.isNewUser}
        />

        <OnboardingIncompleteBanner show={showOnboardingBanner} />

        {showOnboardingBanner && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <section aria-label="Stats overview">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
            Overview
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Matches"
              value={data.matchesCount}
              accent="blue"
              icon={<UserGroupIcon className="h-6 w-6" />}
            />
            <StatCard
              label="Reviews"
              value={data.referenceCount}
              accent="emerald"
              icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />}
            />
            <StatCard
              label="Jobs"
              value={data.jobsCount}
              accent="slate"
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
              accent="amber"
            />
          </div>
        </section>

        <section aria-label="Recent activity and matches" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent activity</h2>
            <ActivityFeed items={data.activities} />
          </div>
          <div className="space-y-8">
            <MatchPreview matches={data.matchesPreview} />
            <DashboardProfileStrength percent={data.profileStrengthPct} />
          </div>
        </section>
      </div>
    </div>
  );
}
