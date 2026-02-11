import { Button } from "@/components/ui/button";

const BULLETS = [
  "Team confidence metrics",
  "Fraud detection signals",
  "Risk flags",
  "Hiring confidence analytics",
  "Reputation benchmarking",
];

export default function EnterpriseSection() {
  return (
    <section className="bg-slate-50 dark:bg-slate-800/30 border-y border-slate-200 dark:border-slate-700/80 py-20" id="enterprise">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Enterprise Employment Intelligence
        </h2>
        <p className="mt-6 max-w-3xl text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          For large organizations, WorkVouch delivers:
        </p>
        <ul className="mt-4 grid sm:grid-cols-2 gap-2 list-disc list-inside text-slate-600 dark:text-slate-400">
          {BULLETS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-8 text-slate-700 dark:text-slate-300 font-medium">
          This is employment infrastructure — not a review platform.
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
