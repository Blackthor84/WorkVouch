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
          Verified Employment. Real Intelligence.
        </h1>
        <p className="mt-6 text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
          WorkVouch transforms coworker validation and verified tenure into a dynamic Employment Confidence Score employers can trust.
        </p>
        <ul className="mt-6 space-y-2 text-slate-600 dark:text-slate-400">
          <li>No fake references.</li>
          <li>No résumé inflation.</li>
          <li>No anonymous reviews.</li>
          <li className="font-medium text-slate-800 dark:text-slate-200">Just verified work history and defensible intelligence.</li>
        </ul>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button href="/signup" variant="primary" size="lg">
            Build Your Verified Work Profile
          </Button>
          <Button href="#how-it-works" variant="secondary" size="lg">
            See How It Works
          </Button>
        </div>
      </div>
    </section>
  );
}
