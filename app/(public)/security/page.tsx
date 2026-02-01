import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Trust & Compliance",
  description: "WorkVouch trust and compliance: access controls, feature deployment, data handling, and audit logging.",
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-28">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
          Trust &amp; Compliance
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          WorkVouch is built with structured access controls, controlled feature activation, and role-based enforcement from the foundation up.
        </p>
      </section>

      {/* Access Control */}
      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Role-Based Access
          </h2>
          <p className="mt-6 text-center text-slate-600 dark:text-slate-400">
            Access is restricted by role. Sensitive operations require authenticated sessions and server-side validation.
          </p>
          <ul className="mx-auto mt-6 max-w-xl list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
            <li>Role-based access (User, Employer, Admin)</li>
            <li>Server-side authorization</li>
            <li>Controlled feature rollout</li>
          </ul>
        </div>
      </section>

      {/* Data Handling */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Encrypted Storage &amp; Verification
        </h2>
        <p className="mt-6 text-center text-slate-600 dark:text-slate-400">
          WorkVouch stores structured employment verification data with controlled access.
        </p>
        <ul className="mx-auto mt-6 max-w-xl list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
          <li>Encrypted transport (HTTPS)</li>
          <li>Secure authentication</li>
          <li>Structured verification workflows</li>
          <li>Row-level security</li>
        </ul>
      </section>

      {/* Oversight */}
      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Accountability
          </h2>
          <p className="mt-6 text-center text-slate-600 dark:text-slate-400">
            Administrative actions are logged. Access to sensitive endpoints is controlled.
          </p>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Structured Trust Requires Structured Systems.
        </h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button href="/pricing" variant="primary" size="lg">
            View Pricing
          </Button>
          <Button href="/contact" variant="secondary" size="lg">
            Contact Sales
          </Button>
        </div>
      </section>
    </div>
  );
}
