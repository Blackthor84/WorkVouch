"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export type HeroIndustry = "healthcare" | "tech" | "finance" | "logistics";

const industryCopy: Record<
  HeroIndustry,
  { employerLine: string; employeeLine: string }
> = {
  healthcare: {
    employerLine: "Ensure credential-backed hiring for healthcare teams.",
    employeeLine: "Build verified trust in regulated environments.",
  },
  tech: {
    employerLine: "Hire verified engineers with proven track records.",
    employeeLine: "Turn your experience into trusted signal.",
  },
  finance: {
    employerLine: "Strengthen compliance-driven hiring decisions.",
    employeeLine: "Showcase integrity and employment stability.",
  },
  logistics: {
    employerLine: "Verify workforce reliability at scale.",
    employeeLine: "Build a verifiable employment timeline.",
  },
};

const industryDisplayName: Record<HeroIndustry, string> = {
  healthcare: "Healthcare Teams",
  tech: "Tech",
  finance: "Finance",
  logistics: "Logistics",
};

const defaultEmployeeSubtext =
  "Professional Identity. Controlled by You.";
const defaultEmployerSubtext =
  "Verify Before You Hire. Request a Work Passport.";

interface HeroInteractiveProps {
  industry?: HeroIndustry | null;
}

export default function HeroInteractive({ industry }: HeroInteractiveProps) {
  const [mode, setMode] = useState<"employee" | "employer">("employee");

  const headline =
    mode === "employee"
      ? "Professional Identity. Controlled by You."
      : "Verify Before You Hire.";

  const subtext =
    industry && industryCopy[industry]
      ? mode === "employee"
        ? industryCopy[industry].employeeLine
        : industryCopy[industry].employerLine
      : mode === "employee"
        ? defaultEmployeeSubtext
        : defaultEmployerSubtext;

  const ctaHref =
    mode === "employee" ? "/signup?type=employee" : "/signup?type=employer";

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
        {/* Toggle */}
        <div
          className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 p-1 mb-8"
          role="tablist"
          aria-label="Audience"
        >
          <button
            type="button"
            onClick={() => setMode("employee")}
            role="tab"
            aria-selected={mode === "employee"}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              mode === "employee"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            For Employees
          </button>
          <button
            type="button"
            onClick={() => setMode("employer")}
            role="tab"
            aria-selected={mode === "employer"}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              mode === "employer"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            For Employers
          </button>
        </div>

        {/* Headline + optional industry pill + subtext — single animated block */}
        <div className="min-h-[12rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full flex flex-col items-center lg:items-start gap-2"
            >
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-5xl xl:text-6xl w-full">
                {headline}
              </h1>
              {industry && industryDisplayName[industry] && (
                <span
                  className="text-xs font-medium rounded-full px-3 py-1 bg-slate-200/80 dark:bg-slate-600/40 text-slate-600 dark:text-slate-400"
                  aria-hidden
                >
                  Optimized for {industryDisplayName[industry]}
                </span>
              )}
              <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 w-full mt-2">
                {subtext}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-4">
          <Button href={ctaHref} variant="primary" size="lg">
            {mode === "employee" ? "Build Your Profile" : "Start Employer Trial"}
          </Button>
        </div>
      </div>
    </section>
  );
}
