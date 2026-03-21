import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

export function DashboardHeader({
  firstName,
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

  return (
    <section
      className={cn(
        "rounded-2xl p-6 md:p-8 shadow-lg border text-white relative overflow-hidden",
        isNewUser
          ? "bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 border-indigo-400/30"
          : "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 border-emerald-400/30"
      )}
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%)]" />
      <div className="relative">
        <p className="text-white/90 text-sm font-medium uppercase tracking-wide">Your command center</p>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">
          Welcome back, {firstName}
        </h1>

        <p className="mt-4 text-lg text-white/95 font-medium max-w-xl">
          {isNewUser
            ? "Here’s your starting trust score. Add a job to grow it, then match coworkers and get verified."
            : "Your trust score reflects real work history, matches, and coworker verifications — keep building."}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <p className="text-3xl md:text-4xl font-extrabold tabular-nums flex items-center gap-2">
            <span className="text-amber-300 drop-shadow-sm" aria-hidden>
              ⭐
            </span>
            Trust Score: {pct}
          </p>
          {verifiedByCoworkers > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1.5 text-sm font-semibold">
              <CheckBadgeIcon className="h-5 w-5 text-emerald-200" aria-hidden />
              Verified by {verifiedByCoworkers} coworker{verifiedByCoworkers === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <div className="mt-6 max-w-lg">
          <div className="h-2.5 rounded-full bg-black/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 to-lime-200 transition-all duration-500"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="mt-2 text-xs text-white/80">0–100 scale · updates as your reputation grows</p>
        </div>
      </div>
    </section>
  );
}
