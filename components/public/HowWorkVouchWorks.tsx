import {
  UserGroupIcon,
  CpuChipIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    step: 1,
    title: "Verified Overlap",
    description:
      "Coworkers can only leave reviews if employment overlap is confirmed. No overlap. No review.",
    Icon: UserGroupIcon,
  },
  {
    step: 2,
    title: "Behavioral Intelligence",
    description:
      "Reviews are analyzed for sentiment, consistency, and credibility. Manual manipulation is blocked.",
    Icon: CpuChipIcon,
  },
  {
    step: 3,
    title: "Confidence Scoring",
    description:
      "Your profile strength dynamically updates using tenure, review volume, rating distribution, and fraud safeguards. Scores are capped, normalized, and versioned for integrity.",
    Icon: ChartBarIcon,
  },
];

export default function HowWorkVouchWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20" id="how-it-works">
      <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        How It Works
      </h2>
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {steps.map(({ step, title, description, Icon }) => (
          <Card
            key={step}
            className="border-slate-200 dark:border-slate-700 flex flex-col"
          >
            <CardContent className="flex flex-1 flex-col pt-6">
              <div className="mb-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Step {step}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
