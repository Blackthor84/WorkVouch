"use client";

import { Button } from "@/components/ui/button";

export default function EducationCareerPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117]">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:py-16">
        {/* SECTION 1 — Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-4">
            Built for Hiring in Education.
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
            Hiring risk in education is real: student safety, classroom performance, reputation protection, and rehire eligibility. WorkVouch turns verified school overlap and peer validation into a defensible hiring signal—so you hire with confidence, not guesswork.
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
            Why Hiring in Education Is Different
          </h2>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li><strong className="text-slate-800 dark:text-slate-200">Student safety</strong> — One bad hire can compromise student wellbeing and trust.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Classroom performance</strong> — Claims about past teaching and outcomes must be verifiable.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Reputation protection</strong> — Schools and districts need defensible hiring decisions.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Rehire eligibility</strong> — Knowing whether prior schools would rehire is critical.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Cross-district verification</strong> — Claims about past schools and roles must be confirmed.</li>
          </ul>
        </section>

        {/* Why People in This Career Use WorkVouch */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Why People in This Career Use WorkVouch
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            In education you move between schools, districts, and roles. Principals change, HR is overwhelmed, and substitute or short-term positions often fall through the cracks. When a new school wants to verify your experience, the person who knew you may be gone.
          </p>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Your time in the classroom and with students is real. You shouldn&apos;t have to rely on someone returning a call to prove it.
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside mb-6">
            <li>Administrators or HR don&apos;t respond after you leave a school</li>
            <li>Sub or one-year positions don&apos;t get written into formal references</li>
            <li>Districts reorganize and records are hard to track down</li>
            <li>Fellow teachers and staff rotate, so nobody can confirm you were there</li>
            <li>Your resume doesn&apos;t reflect the work you actually did</li>
          </ul>
          <p className="text-slate-600 dark:text-slate-400 mb-4 font-medium text-slate-800 dark:text-slate-200">
            How WorkVouch helps:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside mb-6">
            <li>Colleagues who worked with you verify your role and time at the school</li>
            <li>Your tenure, role, and reliability are confirmed by peers who were there</li>
            <li>Your work history stays with you across districts and roles</li>
            <li>You don&apos;t lose opportunities because someone won&apos;t answer the phone</li>
          </ul>
          <p className="text-slate-600 dark:text-slate-400">
            Your experience shouldn&apos;t disappear just because a school restructures or a principal moves on. WorkVouch helps you keep proof of the work you actually did.
          </p>
        </section>

        {/* SECTION 3 — For Employees */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            For Education Professionals
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Your teaching and support experience deserves to be seen and trusted. WorkVouch helps you build a verified reputation backed by real coworkers and real overlap—so employers see tenure, peer validation, rehire signals, and career mobility proof, not just a résumé.
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Verified tenure at schools and districts</li>
            <li>Peer validation from fellow educators and administrators</li>
            <li>Rehire signals that follow you across schools</li>
            <li>Overlap verification so employers know you actually worked there</li>
            <li>Career mobility proof as you move between roles and districts</li>
          </ul>
        </section>

        {/* SECTION 4 — For Employers */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            For Education Employers
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Stop relying on claims. Get verified overlap matching, confidence scoring, sentiment direction, fraud resistance, rehire intelligence, and tenure strength—so every hire is informed by data, not hope.
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Verified overlap matching with past schools and districts</li>
            <li>Confidence scoring that reflects tenure and peer volume</li>
            <li>Sentiment analysis from real coworker reviews</li>
            <li>Fraud resistance — one review per verified overlap, no self-reviews</li>
            <li>Rehire intelligence and tenure strength at a glance</li>
          </ul>
        </section>

        {/* SECTION 5 — Intelligence Breakdown */}
        <section className="mb-16 border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Education Confidence Score
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Education Confidence Score includes:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>Verified tenure at schools and districts</li>
            <li>Review volume from peers who worked alongside the candidate</li>
            <li>Sentiment direction — how coworkers describe reliability and professionalism</li>
            <li>Rating distribution — consistency across references</li>
            <li>Rehire eligibility — whether prior schools would rehire</li>
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
            A district hired a teacher who claimed five years at a neighboring district. After onboarding, performance and attendance issues emerged. A later check revealed limited actual overlap at the schools listed, low review volume from real peers, and sentiment signals that pointed to reliability concerns. A rehire flag from a prior school was never surfaced. WorkVouch would have revealed limited overlap, low review volume, sentiment signals, and the rehire flag before the offer—turning a costly mistake into a data-driven pass.
          </p>
        </section>

        {/* SECTION 7 — Final CTA */}
        <section className="border-t border-slate-200 dark:border-slate-700 pt-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Own Your Reputation in Education.
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
