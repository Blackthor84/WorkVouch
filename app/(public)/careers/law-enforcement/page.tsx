"use client";

import { Button } from "@/components/ui/button";

export default function LawEnforcementCareerPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117]">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:py-16">
        {/* SECTION 1 — Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-4">
            Built for Hiring in Law Enforcement.
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
            Hiring risk in law enforcement is high: public trust, discipline history, shift reliability, and rehire eligibility matter. WorkVouch turns verified agency overlap and peer validation into a defensible hiring signal—so departments hire with confidence, not guesswork.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button href="/signup?type=employee" variant="primary" size="lg">
              Build Your Verified Law Enforcement Profile
            </Button>
            <Button href="/signup" variant="secondary" size="lg">
              Reduce Hiring Risk in Law Enforcement
            </Button>
          </div>
        </section>

        {/* SECTION 2 — Industry Hiring Pain Points */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Why Hiring in Law Enforcement Is Different
          </h2>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li><strong className="text-slate-800 dark:text-slate-200">Public trust and accountability</strong> — One bad hire can damage agency reputation and community relations.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Discipline and performance history</strong> — Past incidents and reliability must be verifiable.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Shift and duty reliability</strong> — No-shows and attendance issues put operations and partners at risk.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Rehire eligibility</strong> — Knowing whether prior agencies would rehire is critical.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Cross-agency verification</strong> — Claims about past departments, sheriffs, or corrections must be confirmed.</li>
          </ul>
        </section>

        {/* SECTION 3 — For Employees */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            For Law Enforcement Professionals
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Your service record deserves to be seen and trusted. WorkVouch helps you build a verified reputation backed by real coworkers and real overlap—so agencies see tenure, peer validation, rehire signals, and career mobility proof, not just a résumé.
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Verified tenure at agencies and units</li>
            <li>Peer validation from fellow officers and supervisors</li>
            <li>Rehire signals that follow you across departments</li>
            <li>Overlap verification so employers know you actually served there</li>
            <li>Career mobility proof as you move between roles and agencies</li>
          </ul>
        </section>

        {/* SECTION 4 — For Employers */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            For Law Enforcement Employers
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Stop relying on claims. Get verified overlap matching, confidence scoring, sentiment direction, fraud resistance, rehire intelligence, and tenure strength—so every hire is informed by data, not hope.
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Verified overlap matching with past agencies and units</li>
            <li>Confidence scoring that reflects tenure and peer volume</li>
            <li>Sentiment analysis from real coworker reviews</li>
            <li>Fraud resistance — one review per verified overlap, no self-reviews</li>
            <li>Rehire intelligence and tenure strength at a glance</li>
          </ul>
        </section>

        {/* SECTION 5 — Intelligence Breakdown */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Law Enforcement Confidence Score
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Law Enforcement Confidence Score includes:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Verified tenure at agencies and posts</li>
            <li>Review volume from peers who worked alongside the candidate</li>
            <li>Sentiment direction — how coworkers describe reliability and professionalism</li>
            <li>Rating distribution — consistency across references</li>
            <li>Rehire eligibility — whether prior agencies would rehire</li>
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
            A department hired an officer who claimed five years at a neighboring agency. After onboarding, discipline and attendance issues surfaced. A later check revealed limited actual overlap at the agencies listed, low review volume from real peers, and sentiment signals that pointed to reliability concerns. A rehire flag from a prior employer was never surfaced. WorkVouch would have revealed limited overlap, low review volume, sentiment signals, and the rehire flag before the offer—turning a costly mistake into a data-driven pass.
          </p>
        </section>

        {/* SECTION 7 — Final CTA */}
        <section className="border-t border-slate-200 dark:border-slate-700 pt-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Own Your Reputation in Law Enforcement.
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
