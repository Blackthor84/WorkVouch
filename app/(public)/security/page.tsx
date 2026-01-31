import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Security & Compliance",
  description: "WorkVouch security and data integrity: access controls, feature deployment, data handling, and audit logging.",
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-28">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
          Security and Data Integrity by Design.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          WorkVouch is built with structured access controls, controlled feature activation, and role-based enforcement from the foundation up.
        </p>
      </section>

      {/* Access Control */}
      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Role-Based Access Control
          </h2>
          <p className="mt-6 text-center text-slate-600 dark:text-slate-400">
            Access to administrative functionality is restricted through structured role assignments. Sensitive operations require authenticated sessions and server-side validation.
          </p>
          <ul className="mx-auto mt-6 max-w-xl list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
            <li>Role-based access (User, Employer, Admin, SuperAdmin)</li>
            <li>Server-side authorization enforcement</li>
            <li>Service-role database operations</li>
            <li>Feature-level access control</li>
          </ul>
        </div>
      </section>

      {/* Feature Control Infrastructure */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Controlled Feature Deployment
        </h2>
        <p className="mt-6 text-center text-slate-600 dark:text-slate-400">
          WorkVouch includes a feature flag infrastructure that allows platform-level control over feature visibility and activation.
        </p>
        <ul className="mx-auto mt-6 max-w-xl list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
          <li>Global feature toggles</li>
          <li>Per-user and per-employer overrides</li>
          <li>Hidden features until explicitly enabled</li>
          <li>Database-persisted flag assignments</li>
          <li>Administrative preview modes</li>
        </ul>
      </section>

      {/* Data Handling */}
      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Data Handling & Storage
          </h2>
          <p className="mt-6 text-center text-slate-600 dark:text-slate-400">
            WorkVouch stores structured employment verification data with controlled access policies.
          </p>
          <ul className="mx-auto mt-6 max-w-xl list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
            <li>Encrypted transport (HTTPS)</li>
            <li>Secure authentication flows</li>
            <li>Server-side session validation</li>
            <li>Row-level security enforcement</li>
            <li>Restricted direct client database writes</li>
          </ul>
        </div>
      </section>

      {/* Audit & Oversight */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Administrative Audit Logging
        </h2>
        <p className="mt-6 text-center text-slate-600 dark:text-slate-400">
          Administrative actions such as impersonation and feature control changes are logged for accountability.
        </p>
        <ul className="mx-auto mt-6 max-w-xl list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
          <li>Logged admin actions</li>
          <li>Role change tracking</li>
          <li>Impersonation audit entries</li>
          <li>Controlled administrative endpoints</li>
        </ul>
      </section>

      {/* Platform Architecture */}
      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Platform Architecture
          </h2>
          <p className="mt-6 text-center text-slate-700 dark:text-slate-300">
            WorkVouch is structured to support scalable subscription enforcement, plan-based usage limits, and controlled feature growth without architectural rewrites.
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
