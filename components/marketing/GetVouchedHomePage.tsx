import Link from "next/link";

const ctaClass =
  "inline-flex min-h-[52px] min-w-[min(100%,17rem)] items-center justify-center rounded-xl bg-black px-8 py-3.5 text-lg font-bold tracking-tight text-white shadow-xl shadow-black/25 ring-2 ring-black/10 transition hover:bg-zinc-900 hover:shadow-2xl hover:shadow-black/30 active:scale-[0.98]";

type Props = {
  /** Logged-out only — avoids double nav with global Navbar when signed in. */
  showMinimalNav?: boolean;
};

/**
 * Conversion homepage — optional minimal top nav, centered stack, gradient CTAs → `/onboarding`.
 */
export default function GetVouchedHomePage({ showMinimalNav = true }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      {showMinimalNav ? (
        <nav
          className="sticky top-0 z-10 flex w-full items-center justify-between border-b border-gray-100 bg-white/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/80"
          aria-label="Primary"
        >
          <Link href="/" className="text-lg font-bold text-gray-900">
            WorkVouch
          </Link>

          <div className="flex gap-4 text-sm">
            <Link href="/employers" className="text-gray-600 transition hover:text-black">
              For Employers
            </Link>
            <Link href="/login" className="text-gray-600 transition hover:text-black">
              Login
            </Link>
          </div>
        </nav>
      ) : null}

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-12 pt-6 text-center sm:px-8">
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
        <div className="mt-6 flex flex-col items-center">
          <Link href="/onboarding" className={ctaClass}>
            Start Getting Verified
          </Link>
          <p className="mt-3 max-w-sm text-center text-xs text-gray-500">
            Employers use WorkVouch to find trusted workers →{" "}
            <Link href="/employers" className="ml-1 underline hover:text-gray-800">
              Learn more
            </Link>
          </p>
        </div>

        {/* Hiring */}
        <div className="mt-16 w-full max-w-lg border-t border-gray-200 pt-10 text-center">
          <h2 className="mb-2 text-lg font-bold text-gray-900">Hiring?</h2>

          <p className="mb-4 text-gray-600">
            See which candidates are actually trusted by their coworkers.
          </p>

          <Link
            href="/employers"
            className="inline-block rounded-lg border border-gray-900 px-5 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
          >
            View Verified Workers
          </Link>
        </div>
      </div>
    </div>
  );
}
