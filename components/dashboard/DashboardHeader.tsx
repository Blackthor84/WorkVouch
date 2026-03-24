import Link from "next/link";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

type VerificationTier = "unverified" | "verified" | "trusted";

function tierFromScore(verifiedByCoworkers: number, trustScore: number): VerificationTier {
  if (verifiedByCoworkers === 0) return "unverified";
  const pct = Math.min(100, Math.max(0, Math.round(trustScore)));
  if (pct >= 70) return "trusted";
  return "verified";
}

export function DashboardHeader({
  firstName: _firstName,
  trustScore,
  verifiedByCoworkers,
  isNewUser,
}: {
  firstName: string;
  trustScore: number;
  verifiedByCoworkers: number;
  isNewUser: boolean;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(trustScore)));
  const tier = tierFromScore(verifiedByCoworkers, trustScore);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-xl border p-6 text-white shadow-lg ring-1 ring-black/5 md:p-8 dark:border-white/10 dark:ring-white/10",
        isNewUser
          ? "bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 border-indigo-400/30"
          : "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 border-emerald-400/30"
      )}
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%)]" />
      <div className="relative flex flex-col gap-4">
        <p className="text-xs font-medium uppercase tracking-wide text-white/80">Your command center</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h1>
        {tier === "unverified" && (
          <div className="text-white/70 text-sm mt-1">
            One confirmation separates you from being verified
          </div>
        )}

        <p className="max-w-xl text-sm text-white/90">
          {isNewUser
            ? "Here’s your starting trust score. Add a job to grow it, then match coworkers and get verified."
            : "Your trust score reflects real work history, matches, and coworker verifications — keep building."}
        </p>

        {tier === "unverified" ? (
          <div className="flex flex-col gap-0">
            <p className="text-2xl font-semibold tracking-tight text-white">
              You&apos;re 1 vouch away from getting verified
            </p>
            <div className="text-sm text-white/80 mt-2">
              Verified users get more trust and better opportunities
            </div>
            <div className="mt-3 text-sm flex items-center gap-2">
              <span className="text-white/70">Status:</span>
              <span className="px-2 py-0.5 rounded-full bg-yellow-300/20 text-yellow-200 font-semibold text-xs">
                Unverified
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <p className="flex items-center gap-2 text-2xl font-semibold tabular-nums text-white">
                <span className="text-amber-300 drop-shadow-sm" aria-hidden>
                  ⭐
                </span>
                Trust Score: {pct}
              </p>
              {verifiedByCoworkers > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                  <CheckBadgeIcon className="h-5 w-5 text-emerald-200" aria-hidden />
                  Verified by {verifiedByCoworkers} coworker{verifiedByCoworkers === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <div className="mt-3 text-sm flex items-center gap-2">
              <span className="text-white/70">Status:</span>
              {tier === "trusted" ? (
                <span className="px-2 py-0.5 rounded-full bg-blue-300/20 text-blue-200 font-semibold text-xs">
                  Trusted
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-300/20 text-emerald-200 font-semibold text-xs">
                  Verified
                </span>
              )}
            </div>
          </>
        )}
        <Link
          href="/coworker-matches"
          className="mt-5 inline-flex w-fit items-center justify-center rounded-lg bg-white px-5 py-2 text-sm font-semibold text-blue-600 shadow-md transition hover:scale-[1.02] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          + Add Coworker
        </Link>
        <div className="max-w-lg space-y-2">
          <div className="h-2.5 overflow-hidden rounded-full bg-black/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 to-lime-200 transition-all duration-500"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="text-xs text-white/80">
            {tier === "unverified"
              ? "Complete 1 coworker verification to unlock Verified status"
              : "0–100 scale · updates as your reputation grows"}
          </p>
        </div>
      </div>
    </section>
  );
}
