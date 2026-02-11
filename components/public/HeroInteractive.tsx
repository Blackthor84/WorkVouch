"use client";

import { Button } from "@/components/ui/button";

export type HeroIndustry = "healthcare" | "tech" | "finance" | "logistics";

interface HeroInteractiveProps {
  industry?: HeroIndustry | null;
}

export default function HeroInteractive({ industry: _industry }: HeroInteractiveProps) {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28" id="hero">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-4xl lg:text-5xl">
          Verified Work History. Real Coworker References.
        </h1>
        <p className="mt-6 text-base text-[#334155] leading-relaxed md:text-xl">
          WorkVouch helps employees prove their experience and helps employers hire with confidence.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
          <Button href="/signup" variant="primary" size="lg" className="w-full sm:w-auto">
            Get Started Free
          </Button>
          <Button href="#how-it-works" variant="secondary" size="lg" className="w-full sm:w-auto">
            See How It Works
          </Button>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-10 text-left max-w-2xl mx-auto">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#64748B] mb-3">
              For Employees
            </h3>
            <ul className="space-y-2 text-[#334155]">
              <li>Verify your real work history</li>
              <li>Collect references from coworkers</li>
              <li>Build a Reputation Score (0–100)</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#64748B] mb-3">
              For Employers
            </h3>
            <ul className="space-y-2 text-[#334155]">
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
