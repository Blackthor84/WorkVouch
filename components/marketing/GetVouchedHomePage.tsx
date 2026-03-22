import Link from "next/link";

const ctaClass =
  "inline-flex min-h-[52px] min-w-[min(100%,17rem)] items-center justify-center rounded-xl bg-black px-8 py-3.5 text-lg font-bold tracking-tight text-white shadow-xl shadow-black/25 ring-2 ring-black/10 transition hover:bg-zinc-900 hover:shadow-2xl hover:shadow-black/30 active:scale-[0.98]";

/**
 * Conversion homepage — centered stack, black CTAs → `/onboarding` (auth redirects to login).
 */
export default function GetVouchedHomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-12 pt-8 text-center sm:px-8">
      {/* HERO */}
      <h1 className="mb-4 max-w-md text-3xl font-bold leading-tight text-gray-900">
        Get verified by people you actually worked with
      </h1>

      <p className="mb-6 max-w-md text-gray-600">
        Stop relying on resumes. If you&apos;ve worked with solid people, prove it in seconds.
      </p>

      <div className="flex flex-col items-center">
        <Link href="/onboarding" className={ctaClass}>
          Get Your First Vouch
        </Link>
        <p className="mt-2 text-xs text-gray-400">Takes less than 60 seconds</p>
        <p className="mt-1 text-xs text-gray-400">
          Don&apos;t fall behind — people are already getting verified
        </p>
      </div>

      {/* TRUST TRIGGER */}
      <p className="mt-8 max-w-sm text-sm text-gray-500">
        Most workers never get credit for how good they actually are.
      </p>

      {/* HOW IT WORKS */}
      <div className="mt-10 w-full max-w-sm text-left">
        <h2 className="mb-3 font-bold text-gray-900">How it works</h2>

        <div className="space-y-2 text-gray-600">
          <p>1. Add your job</p>
          <p>2. Invite coworkers</p>
          <p>3. Get verified</p>
        </div>
      </div>

      {/* URGENCY */}
      <p className="mt-8 max-w-sm text-sm font-semibold text-gray-900">
        People with verified coworkers stand out instantly
      </p>

      {/* SOCIAL PROOF */}
      <p className="mt-4 max-w-sm text-xs text-gray-400">
        Workers in New Hampshire are already getting vouched for
      </p>

      {/* FINAL CTA */}
      <Link href="/onboarding" className={`${ctaClass} mt-6`}>
        Start Getting Verified
      </Link>
    </div>
  );
}
