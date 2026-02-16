"use client";

import { Button } from "@/components/ui/button";

export default function ConstructionCareerPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117]">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:py-16">
        {/* SECTION 1 — Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-4">
            Built for Hiring in Construction.
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
            Hiring risk in construction is real: jobsite safety, crew reliability, rehire consistency, and project stability. WorkVouch turns verified site overlap and peer validation into a defensible hiring signal—so you hire with confidence, not guesswork.
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
            Why Hiring in Construction Is Different
          </h2>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li><strong className="text-slate-800 dark:text-slate-200">Jobsite safety</strong> — One bad hire can cause injuries, incidents, or compliance failures.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Crew reliability</strong> — No-shows and call-offs leave crews short and projects at risk.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Rehire consistency</strong> — Knowing whether prior employers would rehire reduces repeat mistakes.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Project stability</strong> — Claims about past sites, trades, and employers must be verifiable.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Trade and tenure verification</strong> — Overlap at real jobsites matters more than résumé claims.</li>
          </ul>
        </section>

        {/* Why People in This Career Use WorkVouch */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Why People in This Career Use WorkVouch
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            In construction you jump from project to project and employer to employer. Past supervisors move on, companies get bought, and jobsite records disappear. When the next GC or contractor wants to verify you worked there, often nobody answers.
          </p>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Your trade and your time on the tools are real. Proving it shouldn&apos;t depend on a phone call that never gets returned.
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside mb-6">
            <li>Foremen or project managers leave and your history goes with them</li>
            <li>Short jobs or subcontracts never make it onto a formal reference</li>
            <li>Companies merge or shut down and records are gone</li>
            <li>Crews change every job, so nobody can confirm you were there</li>
            <li>Your resume doesn&apos;t reflect the work you actually did</li>
          </ul>
          <p className="text-slate-600 dark:text-slate-400 mb-4 font-medium text-slate-800 dark:text-slate-200">
            How WorkVouch helps:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside mb-6">
            <li>Coworkers and crew verify you actually worked on that site or for that employer</li>
            <li>Your role, schedule, and reliability are confirmed by people who were there</li>
            <li>Your work history stays with you from job to job</li>
            <li>You don&apos;t miss out because a former boss won&apos;t pick up the phone</li>
          </ul>
          <p className="text-slate-600 dark:text-slate-400">
            What you built and where you showed up shouldn&apos;t vanish when a project ends. WorkVouch helps you keep proof of the work you actually did.
          </p>
        </section>

        {/* SECTION 3 — For Employees */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            For Construction Professionals
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Your jobsite experience deserves to be seen and trusted. WorkVouch helps you build a verified reputation backed by real coworkers and real overlap—so employers see tenure, peer validation, rehire signals, and career mobility proof, not just a résumé.
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Verified tenure at sites and employers</li>
            <li>Peer validation from fellow crew and foremen</li>
            <li>Rehire signals that follow you across employers</li>
            <li>Overlap verification so employers know you actually worked there</li>
            <li>Career mobility proof as you move between projects and trades</li>
          </ul>
        </section>

        {/* SECTION 4 — For Employers */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            For Construction Employers
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Stop relying on claims. Get verified overlap matching, confidence scoring, sentiment direction, fraud resistance, rehire intelligence, and tenure strength—so every hire is informed by data, not hope.
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Verified overlap matching with past sites and employers</li>
            <li>Confidence scoring that reflects tenure and peer volume</li>
            <li>Sentiment analysis from real coworker reviews</li>
            <li>Fraud resistance — one review per verified overlap, no self-reviews</li>
            <li>Rehire intelligence and tenure strength at a glance</li>
          </ul>
        </section>

        {/* SECTION 5 — Intelligence Breakdown */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Construction Confidence Score
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Construction Confidence Score includes:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Verified tenure at sites and employers</li>
            <li>Review volume from peers who worked alongside the candidate</li>
            <li>Sentiment direction — how coworkers describe reliability and safety</li>
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
            A contractor hired a lead who claimed six years at a major GC. After onboarding, attendance and safety incidents emerged. A later check revealed limited actual overlap at the sites listed, low review volume from real peers, and sentiment signals that pointed to reliability concerns. A rehire flag from a prior employer was never surfaced. WorkVouch would have revealed limited overlap, low review volume, sentiment signals, and the rehire flag before the offer—turning a costly mistake into a data-driven pass.
          </p>
        </section>

        {/* SECTION 7 — Final CTA */}
        <section className="border-t border-slate-200 dark:border-slate-700 pt-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Own Your Reputation in Construction.
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
