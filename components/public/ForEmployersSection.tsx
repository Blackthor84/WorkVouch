import { Button } from "@/components/ui/button";

const BULLETS = [
  "Verified tenure",
  "Peer review volume",
  "Behavioral sentiment",
  "Rating distribution",
  "Rehire eligibility",
  "Cross-role consistency",
];

export default function ForEmployersSection() {
  return (
    <section className="bg-slate-50 dark:bg-slate-800/30 border-y border-slate-200 dark:border-slate-700/80 py-20" id="for-employers">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Hire With Confidence — Not Guesswork
        </h2>
        <p className="mt-6 max-w-3xl text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          WorkVouch replaces traditional references with verified coworker overlap and fraud-resistant peer validation.
        </p>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          Our intelligence engine analyzes:
        </p>
        <ul className="mt-4 grid sm:grid-cols-2 gap-2 list-disc list-inside text-slate-600 dark:text-slate-400">
          {BULLETS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-6 max-w-2xl text-slate-700 dark:text-slate-300 font-medium">
          All converted into a dynamic Employment Confidence Score.
        </p>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          You don&apos;t just see what someone claims.<br />You see how they performed.
        </p>
        <div className="mt-10">
          <Button href="/signup" variant="primary" size="lg">
            Explore Employer Tools
          </Button>
        </div>
      </div>
    </section>
  );
}
