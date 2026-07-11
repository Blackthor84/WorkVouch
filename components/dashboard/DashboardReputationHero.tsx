import { WvCard, WvTrustScore, WvBadge } from "@/components/wv";

export function DashboardReputationHero({
  trustScore,
  verificationsThisMonth,
}: {
  trustScore: number;
  verificationsThisMonth: number;
}) {
  return (
    <WvCard glow padding="lg">
      <div className="flex flex-col items-stretch gap-8 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/90 mb-2">
            Your reputation
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-wv-foreground md:text-3xl">
            Trust Score Dashboard
          </h1>
          {verificationsThisMonth > 0 ? (
            <WvBadge variant="success" className="mt-3">
              +{verificationsThisMonth} verification{verificationsThisMonth === 1 ? "" : "s"} this month
            </WvBadge>
          ) : (
            <p className="mt-3 text-sm text-wv-muted leading-relaxed">
              Every verified reference strengthens how employers see you.
            </p>
          )}
        </div>
        <div className="flex justify-center md:justify-end">
          <WvTrustScore score={trustScore} size="lg" />
        </div>
      </div>
    </WvCard>
  );
}
