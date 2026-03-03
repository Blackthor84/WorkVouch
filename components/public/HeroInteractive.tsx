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
          Verified employment. Portable trust.
        </h1>
        <p className="mt-6 text-base text-[#334155] leading-relaxed md:text-xl">
          WorkVouch replaces resumes and informal references with verified, explainable professional records owned by the individual.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
          <Button href="/signup" variant="primary" size="lg" className="w-full sm:w-auto">
            Get Started
          </Button>
          <Button href="#verification" variant="secondary" size="lg" className="w-full sm:w-auto">
            How It Works
          </Button>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-3xl mx-auto">
          <div id="verification">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#64748B] mb-3">
              Verification
            </h3>
            <p className="text-sm text-[#334155]">
              Employment and references are verified at the source. Records are portable and auditable.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#64748B] mb-3">
              Transparency
            </h3>
            <p className="text-sm text-[#334155]">
              Individuals see the same view employers see. Trust band and factors are explainable.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#64748B] mb-3">
              Control
            </h3>
            <p className="text-sm text-[#334155]">
              Members own their professional record. Visibility and credentials are managed in one place.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
