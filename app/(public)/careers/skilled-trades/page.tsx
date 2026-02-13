"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SkilledTradesCareerPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117]">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:py-16">
        {/* SECTION 1 — Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-4">
            Verified work history for Skilled Trades professionals
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
            Build trust, verify hands-on experience, and stand out with peer-backed references
            from people who have worked alongside you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button href="/signup?type=employee" variant="primary" size="lg">
              Get Started
            </Button>
            <Button href="/login" variant="secondary" size="lg">
              Log In
            </Button>
          </div>
        </section>

        {/* SECTION 2 — Why Hiring in Skilled Trades Is Different */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Why Hiring in Skilled Trades Is Different
          </h2>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li><strong className="text-slate-800 dark:text-slate-200">Hands-on skill verification</strong> — Claims must reflect real, on-the-job experience.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Safety and reliability</strong> — Poor hires increase risk, downtime, and liability.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Job-to-job mobility</strong> — Workers often move between employers and projects.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Credential gaps</strong> — Licenses alone don&apos;t show actual performance.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Trust-based hiring</strong> — Word-of-mouth is common but difficult to verify.</li>
          </ul>
        </section>

        {/* SECTION 3 — What Employers Need to Verify */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            What Employers Need to Verify
          </h2>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Confirmed work history with real employers</li>
            <li>Peer and supervisor references</li>
            <li>Rehire eligibility</li>
            <li>Role-specific experience</li>
            <li>Consistency across job timelines</li>
          </ul>
        </section>

        {/* SECTION 4 — How WorkVouch Helps Skilled Trades Professionals */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            How WorkVouch Helps Skilled Trades Professionals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Peer-Verified Experience</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Confirm your work history through coworkers and supervisors who actually worked with you.
              </p>
            </Card>
            <Card className="p-6 border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Skill & Certification Credibility</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Show proof of real-world experience beyond resumes or licenses.
              </p>
            </Card>
            <Card className="p-6 border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Portable Reputation</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Carry verified references across employers, companies, and regions.
              </p>
            </Card>
            <Card className="p-6 border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Faster Hiring Decisions</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Reduce delays by giving employers verified information upfront.
              </p>
            </Card>
          </div>
        </section>

        {/* SECTION 5 — Employer Benefits */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Why Employers Use WorkVouch
          </h2>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Reduce hiring risk</li>
            <li>Prevent résumé fraud</li>
            <li>Make defensible hiring decisions</li>
            <li>Verify experience before onboarding</li>
            <li>Improve workforce quality</li>
          </ul>
        </section>

        {/* SECTION 6 — Call to Action */}
        <section className="border-t border-slate-200 dark:border-slate-700 pt-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Build a verified work history that speaks for itself
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <Button href="/signup?type=employee" variant="primary" size="lg">
              Create Your Profile
            </Button>
            <Button href="/signup" variant="secondary" size="lg">
              Learn More
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
