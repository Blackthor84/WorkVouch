"use client";

import { Button } from "@/components/ui/button";

export default function SecurityCareerPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117]">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:py-16">
        {/* SECTION 1 — Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-4">
            Built for Hiring in Security.
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
            Hiring risk in security is real: incident response reliability, shift dependability, and high-trust environments demand verified history. WorkVouch turns verified post overlap and peer validation into a defensible hiring signal—so you hire with confidence, not guesswork.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button href="/signup?type=employee" variant="primary" size="lg">
              Build Your Verified Security Profile
            </Button>
            <Button href="/signup" variant="secondary" size="lg">
              Reduce Hiring Risk in Security
            </Button>
          </div>
        </section>

        {/* SECTION 2 — Industry Hiring Pain Points */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Why Hiring in Security Is Different
          </h2>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li><strong className="text-slate-800 dark:text-slate-200">Incident response reliability</strong> — Guards and officers must perform under pressure; past behavior predicts future response.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Shift dependability</strong> — No-shows and call-offs leave posts uncovered and assets at risk.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">High-trust environments</strong> — One bad hire can compromise site safety and client trust.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Post and employer history</strong> — Claims about past sites and employers must be verifiable.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Rehire and turnover signals</strong> — Knowing whether prior employers would rehire reduces repeat mistakes.</li>
          </ul>
        </section>

        {/* SECTION 3 — For Employees */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            For Security Professionals
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Your post history deserves to be seen and trusted. WorkVouch helps you build a verified reputation backed by real coworkers and real overlap—so employers see tenure, peer validation, rehire signals, and career mobility proof, not just a résumé.
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Verified tenure at sites and posts</li>
            <li>Peer validation from fellow guards and supervisors</li>
            <li>Rehire signals that follow you across employers</li>
            <li>Overlap verification so employers know you actually worked there</li>
            <li>Career mobility proof as you move between sites and roles</li>
          </ul>
        </section>

        {/* SECTION 4 — For Employers */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            For Security Employers
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Stop relying on claims. Get verified overlap matching, confidence scoring, sentiment direction, fraud resistance, rehire intelligence, and tenure strength—so every hire is informed by data, not hope.
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Verified overlap matching with past sites and posts</li>
            <li>Confidence scoring that reflects tenure and peer volume</li>
            <li>Sentiment analysis from real coworker reviews</li>
            <li>Fraud resistance — one review per verified overlap, no self-reviews</li>
            <li>Rehire intelligence and tenure strength at a glance</li>
          </ul>
        </section>

        {/* SECTION 5 — Intelligence Breakdown */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Security Confidence Score
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Security Confidence Score includes:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Verified tenure at sites and employers</li>
            <li>Review volume from peers who worked alongside the candidate</li>
            <li>Sentiment direction — how coworkers describe reliability and professionalism</li>
            <li>Rating distribution — consistency across references</li>
            <li>Rehire eligibility — whether prior employers would rehire</li>
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
            A security company hired a guard who claimed three years at a high-profile site. After onboarding, attendance and performance issues emerged. A later check revealed limited actual overlap at the sites listed, low review volume from real peers, and sentiment signals that pointed to reliability concerns. A rehire flag from a prior employer was never surfaced. WorkVouch would have revealed limited overlap, low review volume, sentiment signals, and the rehire flag before the offer—turning a costly mistake into a data-driven pass.
          </p>
        </section>

        {/* SECTION 7 — Final CTA */}
        <section className="border-t border-slate-200 dark:border-slate-700 pt-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Own Your Reputation in Security.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            Stop Guessing. Start Verifying.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <Button href="/signup?type=employee" variant="primary" size="lg">
              Create Profile
            </Button>
            <Button href="/signup" variant="secondary" size="lg">
              Employer Sign Up
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
