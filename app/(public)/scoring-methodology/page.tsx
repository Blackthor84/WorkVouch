/**
 * Public scoring methodology page. Sanitized: no exact constants, no reverse-engineering.
 * Explains tenure, review volume, sentiment, rating distribution, rehire multiplier, fraud safeguards.
 */

export const metadata = {
  title: "Trust & Scoring Methodology | WorkVouch",
  description:
    "How WorkVouch calculates reputation scores: tenure, peer reviews, sentiment, ratings, rehire eligibility, and fraud safeguards.",
};

export default function ScoringMethodologyPage() {
  return (
    <div className="min-h-screen">
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Trust &amp; Scoring Methodology
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          WorkVouch reputation scores (0–100) reflect verified work history and peer feedback.
          This page explains the principles behind the score without exposing proprietary formulas.
        </p>
      </section>

      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Score range
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            All scores are on a 0–100 scale. The final value is clamped so it never goes below 0 or above 100,
            regardless of inputs. This keeps scores comparable and predictable.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Tenure strength
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Longer verified employment history contributes positively to the score. Tenure is capped
          so that very long histories do not dominate; the system rewards consistency without
          over-weighting a single dimension.
        </p>
      </section>

      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Review volume cap
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            The number of peer reviews (references) you receive increases your score up to a cap.
            Beyond that cap, additional reviews do not keep increasing the score. This prevents
            gaming and keeps the score balanced across tenure, quality, and volume.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Sentiment influence
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          The overall tone of peer feedback (positive vs. negative) is factored into the score.
          More positive sentiment improves the score; negative sentiment reduces it. Sentiment
          is normalized so that extreme values do not blow out the scale.
        </p>
      </section>

      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Rating distribution
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Peer ratings (e.g. 1–5) are averaged and mapped into the score. Neutral ratings sit
            around the middle of the scale; higher average ratings increase the score, lower
            averages decrease it. The mapping is designed for fairness and is bounded.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Rehire multiplier
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          When employers indicate they would rehire you (rehire-eligible), that signal is applied
          as a positive multiplier to the raw score. When rehire status is not eligible, a lower
          multiplier is used. This keeps the final score in the 0–100 range.
        </p>
      </section>

      <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Fraud safeguards
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            WorkVouch incorporates fraud signals into scoring. When fraud indicators are present,
            a penalty is applied to the score. The penalty is capped so that a single signal
            cannot push the score below a reasonable floor, and the final score remains in 0–100.
            We do not disclose exact penalty values to avoid gaming.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Recalculation triggers
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Scores are recalculated when something relevant changes: for example, when a new peer
          reference is added, when employment is verified, when a dispute is resolved, or when
          an optional system-wide recalculation runs. Each change is logged for audit. You do
          not need to do anything special to “refresh” your score; it updates as your profile
          and verification data change.
        </p>
      </section>

      <section className="border-t border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
          <p className="text-slate-600 dark:text-slate-400">
            For questions about your score or verification, see{" "}
            <a href="/help" className="text-primary hover:underline">Help</a> or contact support.
          </p>
        </div>
      </section>
    </div>
  );
}
