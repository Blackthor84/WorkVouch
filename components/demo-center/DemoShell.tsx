"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type DemoShellProps = {
  children: React.ReactNode;
  flow?: "landing" | "employee" | "employer";
  step?: number;
  totalSteps?: number;
  stepLabel?: string;
  onBack?: () => void;
};

export function DemoShell({
  children,
  flow = "landing",
  step,
  totalSteps,
  stepLabel,
  onBack,
}: DemoShellProps) {
  const reduceMotion = useReducedMotion();
  const progress =
    step != null && totalSteps != null && totalSteps > 0
      ? Math.round((step / totalSteps) * 100)
      : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <a
        href="#demo-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:font-medium"
      >
        Skip to demo content
      </a>

      {/* Ambient gradient mesh */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* Demo banner */}
      <div
        role="status"
        className="relative z-10 bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-sm px-4 py-2 text-center text-sm font-medium text-white"
      >
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Interactive Demo — Sample data only · No account required
        </span>
      </div>

      <header className="relative z-40 sticky top-0 border-b border-white/10 bg-[#0a0a0f]/85 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0a0a0f]/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/demo"
            className="flex items-center gap-2.5 group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              WV
            </span>
            <div>
              <p className="text-sm font-bold leading-tight">WorkVouch</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-blue-400">
                Live Demo
              </p>
            </div>
          </Link>

          <nav aria-label="Demo sections" className="flex items-center gap-1">
            {(
              [
                { href: "/demo", label: "Home", active: flow === "landing" },
                { href: "/demo/employee", label: "Employee", active: flow === "employee" },
                { href: "/demo/employer", label: "Employer", active: flow === "employer" },
              ] as const
            ).map(({ href, label, active }) => (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50",
                  active
                    ? "bg-white/10 text-white ring-1 ring-white/20"
                    : "text-white/60 hover:text-white hover:bg-white/5",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {progress != null && stepLabel && totalSteps && step && (
          <div className="border-t border-white/5 px-4 py-2.5">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                <span className="flex items-center gap-2">
                  {onBack && step > 1 && (
                    <button
                      type="button"
                      onClick={onBack}
                      aria-label="Go to previous step"
                      className="flex items-center gap-1 rounded-md p-1 text-white/70 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <span className="font-medium text-white/80">{stepLabel}</span>
                </span>
                <span aria-live="polite">
                  Step {step} of {totalSteps}
                </span>
              </div>

              {/* Step dots */}
              <div className="hidden sm:flex items-center gap-1 mb-2" aria-hidden>
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors duration-300",
                      i < step ? "bg-blue-500" : i === step - 1 ? "bg-violet-500" : "bg-white/10",
                    )}
                  />
                ))}
              </div>

              <div
                className="h-1 w-full overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Demo progress: ${progress}%`}
              >
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                  initial={reduceMotion ? false : { width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        )}
      </header>

      <main
        id="demo-main"
        className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 pb-16"
      >
        {children}
      </main>

      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-xs text-white/30">
        <p>WorkVouch Live Demo · Sample data for illustration only</p>
      </footer>
    </div>
  );
}
