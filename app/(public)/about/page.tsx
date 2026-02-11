import { Button } from "@/components/ui/button";
import { INFO_EMAIL } from "@/lib/constants/contact";

export default function About() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-28">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
          Building Trust Infrastructure for Hiring.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          WorkVouch introduces structured employment verification into modern hiring workflows.
        </p>
      </section>

      {/* Mission */}
      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Our Mission
          </h2>
          <div className="mt-8 space-y-4 text-slate-600 dark:text-slate-400">
            <p>
              Hiring decisions shape organizations, careers, and communities. Yet verification systems have not evolved with modern workforce mobility.
            </p>
            <p>
              WorkVouch was built to provide structured, documented, and role-based verification of employment history — reducing ambiguity in hiring decisions while increasing accountability.
            </p>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          How WorkVouch Is Different
        </h2>
        <ul className="mx-auto mt-8 max-w-xl list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
          <li>Structured coworker confirmations</li>
          <li>Documented employment verification</li>
          <li>Role-based administrative controls</li>
          <li>Subscription-based employer access</li>
          <li>Scalable plan architecture</li>
        </ul>
        <p className="mt-8 text-center text-slate-700 dark:text-slate-300">
          We are not a resume builder. We are not a job board.
          We are a verification layer built to sit alongside hiring workflows.
        </p>
      </section>

      {/* Platform Structure */}
      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Platform Architecture
          </h2>
          <ul className="mx-auto mt-8 max-w-xl list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
            <li>Secure authentication</li>
            <li>Role-based access</li>
            <li>Feature flag infrastructure</li>
            <li>Audit logging for administrative actions</li>
            <li>Service-role protected database operations</li>
            <li>Tiered subscription enforcement</li>
          </ul>
          <p className="mt-8 text-center text-slate-700 dark:text-slate-300">
            The system is designed for controlled feature activation and enterprise scaling from day one.
          </p>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Who We Serve
        </h2>
        <ul className="mx-auto mt-8 max-w-xl list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
          <li>Small and mid-sized businesses</li>
          <li>Staffing and recruiting firms</li>
          <li>Security and credential-driven agencies</li>
          <li>Growing HR departments</li>
          <li>Organizations prioritizing documented trust</li>
        </ul>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Trust Is Not Claimed. It Is Verified.
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button href="/pricing" variant="primary" size="lg">
              View Pricing
            </Button>
            <Button href="/signup" variant="secondary" size="lg">
              Create Free Account
            </Button>
          </div>
          <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
            General questions?{" "}
            <a href={"mailto:" + INFO_EMAIL} className="text-primary hover:underline">{INFO_EMAIL}</a>
          </p>
        </div>
      </section>
    </div>
  );
}
