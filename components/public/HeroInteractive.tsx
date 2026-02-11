"use client";

import { Button } from "@/components/ui/button";

export type HeroIndustry = "healthcare" | "tech" | "finance" | "logistics";

interface HeroInteractiveProps {
  industry?: HeroIndustry | null;
}

export default function HeroInteractive({ industry: _industry }: HeroInteractiveProps) {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28" id="hero">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
          Verified Work History. Real Coworker References.
        </h1>
        <p className="mt-6 text-xl text-slate-600 dark:text-slate-200 leading-relaxed">
          WorkVouch helps employees prove their experience and helps employers hire with confidence.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button href="/signup" variant="primary" size="lg">
            Get Started Free
          </Button>
          <Button href="#how-it-works" variant="secondary" size="lg">
            See How It Works
          </Button>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 gap-10 text-left max-w-2xl mx-auto">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              For Employees
            </h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li>Verify your real work history</li>
              <li>Collect references from coworkers</li>
              <li>Build a Reputation Score (0–100)</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              For Employers
            </h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li>View verified work history</li>
              <li>See hiring confidence signals</li>
              <li>Reduce resume fraud</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
