import { Button } from "@/components/ui/button";

export const metadata = {
  title: "WorkVouch for Security Agencies",
  description: "Verification built for credential-driven hiring: guard licenses, employment history, and structured verification for security agencies.",
};

export default function SecurityAgenciesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-28">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
          Verification Built for Credential-Driven Hiring.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          Security agencies require documented employment history, license validation, and structured verification workflows.
        </p>
      </section>

      {/* Industry Challenges */}
      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            The Challenge in Security Hiring
          </h2>
          <p className="mt-6 text-center text-slate-600 dark:text-slate-400">
            Security roles require reliability, documented employment history, and accountability across shifts and assignments.
          </p>
          <ul className="mx-auto mt-6 max-w-xl list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
            <li>High turnover environments</li>
            <li>Multi-site staffing</li>
            <li>Guard licensing requirements</li>
            <li>Inconsistent resume documentation</li>
            <li>Limited structured verification tools</li>
          </ul>
        </div>
      </section>

      {/* How WorkVouch Helps */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          How WorkVouch Supports Security Agencies
        </h2>
        <ul className="mx-auto mt-8 max-w-xl list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
          <li>Guard license uploads</li>
          <li>Verification report documentation</li>
          <li>Shift preference tracking</li>
          <li>Peer-confirmed employment history</li>
          <li>Auto-flag inconsistent claims</li>
          <li>Structured trust scoring</li>
        </ul>
      </section>

      {/* Security Agency Bundle */}
      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Security Agency Bundle
          </h2>
          <p className="mt-6 text-center text-slate-700 dark:text-slate-300">
            Purpose-built plan designed for verification-heavy agencies.
          </p>
          <ul className="mx-auto mt-6 max-w-xl list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
            <li>80 verification reports per month</li>
            <li>Unlimited worker searches</li>
            <li>License and certificate uploads</li>
            <li>Inconsistency detection flags</li>
            <li>Structured hiring dashboard</li>
          </ul>
          <div className="mt-10 flex justify-center">
            <Button href="/pricing" variant="primary" size="lg">
              Explore Security Bundle
            </Button>
          </div>
        </div>
      </section>

      {/* Operational Oversight */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Operational Visibility
        </h2>
        <p className="mt-6 text-center text-slate-600 dark:text-slate-400">
          Agencies can monitor report usage, verification activity, and structured documentation across their hiring operations.
        </p>
      </section>

      {/* Final CTA */}
      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Hire with Documented Confidence.
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button href="/pricing" variant="primary" size="lg">
              Start Security Bundle
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
