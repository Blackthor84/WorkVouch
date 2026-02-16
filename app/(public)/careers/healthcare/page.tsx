"use client";

import { Button } from "@/components/ui/button";

export default function HealthcareCareerPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117]">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:py-16">
        {/* SECTION 1 — Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-4">
            Built for Hiring in Healthcare.
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
            Hiring risk in healthcare is real: patient safety, licensing credibility, shift reliability, and burnout-driven turnover. WorkVouch turns verified clinical overlap and peer validation into a defensible hiring signal—so you hire with confidence, not guesswork.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button href="/signup" variant="primary" size="lg">
              Get Verified Work History
            </Button>
          </div>
        </section>

        {/* SECTION 2 — Industry Hiring Pain Points */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Why Hiring in Healthcare Is Different
          </h2>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li><strong className="text-slate-800 dark:text-slate-200">Patient safety</strong> — One bad hire can compromise care quality and outcomes.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Licensing credibility</strong> — Claims about past facilities and roles must be verifiable.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Shift reliability</strong> — No-shows and last-minute call-offs put units and patients at risk.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Burnout turnover</strong> — High churn makes tenure and rehire signals critical.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Cross-facility consistency</strong> — Verifying overlap across hospitals, clinics, and agencies reduces resume inflation.</li>
          </ul>
        </section>

        {/* Why People in This Career Use WorkVouch */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Why People in This Career Use WorkVouch
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            In healthcare you move between facilities, agencies, and shifts. When you leave a job, HR often doesn&apos;t return calls. Your years of experience can disappear when the next employer tries to verify you.
          </p>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            It&apos;s hard to prove where you really worked and who you worked with. WorkVouch gives you a way to carry that proof with you.
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside mb-6">
            <li>Employers or HR don&apos;t respond after you leave</li>
            <li>Short-term or per-diem roles don&apos;t show up on a standard check</li>
            <li>Staffing agencies lose records or go out of business</li>
            <li>Charge nurses and coworkers rotate constantly, so nobody&apos;s left to vouch for you</li>
            <li>Your resume says one thing, but there&apos;s no way to prove it</li>
          </ul>
          <p className="text-slate-600 dark:text-slate-400 mb-4 font-medium text-slate-800 dark:text-slate-200">
            How WorkVouch helps:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside mb-6">
            <li>Coworkers who actually worked with you verify your role and overlap</li>
            <li>Your shifts, units, and reliability get confirmed by peers, not just your word</li>
            <li>Your work history stays with you even when a facility closes or a manager moves on</li>
            <li>You don&apos;t lose opportunities because someone won&apos;t answer the phone</li>
          </ul>
          <p className="text-slate-600 dark:text-slate-400">
            Your experience shouldn&apos;t disappear just because a company restructures or a supervisor leaves. WorkVouch helps you keep proof of the work you actually did.
          </p>
        </section>

        {/* SECTION 3 — For Employees */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            For Healthcare Professionals
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Your clinical experience deserves to be seen and trusted. WorkVouch helps you build a verified reputation backed by real coworkers and real overlap—so employers see tenure, peer validation, rehire signals, and career mobility proof, not just a résumé.
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Verified tenure at facilities and units</li>
            <li>Peer validation from nurses, supervisors, and techs</li>
            <li>Rehire signals that follow you across employers</li>
            <li>Overlap verification so employers know you actually worked there</li>
            <li>Career mobility proof as you move between roles and settings</li>
          </ul>
        </section>

        {/* SECTION 4 — For Employers */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            For Healthcare Employers
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Stop relying on claims. Get verified overlap matching, confidence scoring, sentiment direction, fraud resistance, rehire intelligence, and tenure strength—so every hire is informed by data, not hope.
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Verified overlap matching with past facilities and units</li>
            <li>Confidence scoring that reflects tenure and peer volume</li>
            <li>Sentiment analysis from real coworker reviews</li>
            <li>Fraud resistance — one review per verified overlap, no self-reviews</li>
            <li>Rehire intelligence and tenure strength at a glance</li>
          </ul>
        </section>

        {/* SECTION 5 — Intelligence Breakdown */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Healthcare Confidence Score
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Healthcare Confidence Score includes:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Verified tenure at healthcare facilities</li>
            <li>Review volume from peers who worked alongside the candidate</li>
            <li>Sentiment direction — how coworkers describe reliability and teamwork</li>
            <li>Rating distribution — consistency across references</li>
            <li>Rehire eligibility — whether past employers would rehire</li>
          </ul>
          <p className="text-slate-600 dark:text-slate-400 mt-4">
            Scores are normalized and versioned for integrity. We don&apos;t expose formulas—we give you a clear, defensible signal.
          </p>
        </section>

        {/* SECTION 6 — Real-World Scenario */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            What Happens Without Verification?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            A hospital hired an RN who claimed three years at a major health system. After onboarding, performance issues and attendance problems emerged. A later check revealed limited actual overlap at the facilities listed, low review volume from real peers, and sentiment signals that pointed to reliability concerns. A rehire flag from a prior employer was never surfaced. WorkVouch would have revealed limited overlap, low review volume, sentiment signals, and the rehire flag before the offer—turning a costly mistake into a data-driven pass.
          </p>
        </section>

        {/* SECTION 7 — Final CTA */}
        <section className="border-t border-slate-200 dark:border-slate-700 pt-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Own Your Reputation in Healthcare.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Stop guessing. Start verifying.
          </p>
          <Button href="/signup" variant="primary" size="lg">
            Get Verified Work History
          </Button>
        </section>
      </div>
    </div>
  );
}
