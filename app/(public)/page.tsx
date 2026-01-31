import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-28">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
          Verified Work History for Real Hiring Decisions.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          WorkVouch confirms employment history through structured coworker verification and employer validation — helping teams reduce hiring risk and build workplace trust.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button href="/signup" variant="primary" size="lg">
            Get Started Free
          </Button>
          <Button href="/pricing" variant="secondary" size="lg">
            View Employer Plans
          </Button>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Hiring Decisions Rely on Information That&apos;s Hard to Verify.
          </h2>
          <div className="mt-8 space-y-4 text-slate-600 dark:text-slate-400">
            <p>Resumes can be exaggerated.</p>
            <p>References can be selective.</p>
            <p>Background checks confirm identity — not performance.</p>
            <p className="pt-2">
              Employers often make decisions without validated proof of workplace contribution.
            </p>
            <p className="font-medium text-slate-800 dark:text-slate-200">
              WorkVouch introduces structured verification into the hiring process.
            </p>
          </div>
        </div>
      </section>

      {/* How WorkVouch Works */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:py-24">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          How WorkVouch Works
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <Card hover>
            <CardHeader>
              <CardTitle>For Workers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
                <li>Add past employers</li>
                <li>Invite coworkers to confirm employment</li>
                <li>Collect structured peer references</li>
                <li>Generate a documented trust score</li>
              </ul>
              <p className="text-slate-700 dark:text-slate-300">
                Your work history becomes transparent and portable.
              </p>
            </CardContent>
          </Card>
          <Card hover>
            <CardHeader>
              <CardTitle>For Employers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
                <li>Search worker profiles</li>
                <li>Review structured verification reports</li>
                <li>View coworker confirmations</li>
                <li>Access documented trust metrics</li>
                <li>Export verification summaries</li>
              </ul>
              <p className="text-slate-700 dark:text-slate-300">
                Hiring becomes clearer, faster, and more accountable.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Security & Infrastructure */}
      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Built for Security, Structure, and Scale.
          </h2>
          <ul className="mx-auto mt-8 max-w-xl list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
            <li>Secure authentication</li>
            <li>Role-based access controls</li>
            <li>Encrypted data storage</li>
            <li>Administrative audit logging</li>
            <li>Service-role protected database operations</li>
            <li>Controlled feature activation system</li>
          </ul>
          <p className="mt-8 text-center text-slate-700 dark:text-slate-300">
            The platform is built to support small businesses today and enterprise organizations tomorrow.
          </p>
        </div>
      </section>

      {/* Who It's For */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Who WorkVouch Is For
        </h2>
        <ul className="mx-auto mt-8 max-w-xl list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
          <li>Small businesses hiring locally</li>
          <li>Staffing agencies verifying high volume candidates</li>
          <li>Security firms validating guard credentials</li>
          <li>Growing companies building structured hiring systems</li>
        </ul>
        <p className="mt-8 text-center text-slate-700 dark:text-slate-300">
          If verified experience matters to your organization, WorkVouch adds a layer of documented trust.
        </p>
      </section>

      {/* Pricing Positioning */}
      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Flexible Plans Designed Around Hiring Volume.
          </h2>
          <ul className="mx-auto mt-8 max-w-xl list-inside list-disc space-y-2 text-slate-600 dark:text-slate-400">
            <li>Starter – For small teams</li>
            <li>Team – For growing departments</li>
            <li>Pro – For high-volume organizations</li>
            <li>Security Bundle – For credential-driven agencies</li>
          </ul>
          <p className="mt-8 text-center text-slate-700 dark:text-slate-300">
            No long-term contracts required. Upgrade anytime.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Build Trust Before You Hire.
        </h2>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          Start verifying work history the structured way.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button href="/signup" variant="primary" size="lg">
            Get Started Free
          </Button>
          <Button href="/contact" variant="secondary" size="lg">
            Contact Sales
          </Button>
        </div>
      </section>
    </div>
  );
}
