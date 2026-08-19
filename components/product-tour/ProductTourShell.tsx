"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { PlayCircle } from "lucide-react";

type ProductTourShellProps = {
  children: React.ReactNode;
  section?: "employee" | "employer";
  stepLabel?: string;
};

export function ProductTourShell({ children, section, stepLabel }: ProductTourShellProps) {
  return (
    <div className="min-h-screen bg-wv-bg text-wv-foreground overflow-x-hidden">
      <a
        href="#product-tour-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:font-medium"
      >
        Skip to tour content
      </a>

      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div
        role="status"
        className="relative z-10 border-b border-blue-500/20 bg-blue-600/10 px-4 py-2 text-center text-sm font-medium text-blue-200"
      >
        <span className="inline-flex items-center gap-2">
          <PlayCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Product Tour — Fictional demo data only · No account required
        </span>
      </div>

      <header className="relative z-40 sticky top-0 border-b border-white/10 bg-wv-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/product-tour"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-blue-500/25">
              WV
            </span>
            <div>
              <p className="text-sm font-bold leading-tight">WorkVouch</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-blue-400">
                Product Tour
              </p>
            </div>
          </Link>

          {section && (
            <p
              className={cn(
                "hidden sm:block text-[10px] font-semibold uppercase tracking-[0.2em]",
                section === "employee" ? "text-emerald-400/90" : "text-violet-400/90",
              )}
            >
              {section === "employee" ? "Employee Experience" : "Employer Experience"}
            </p>
          )}
        </div>
      </header>

      {stepLabel && (
        <div className="relative z-30 mx-auto max-w-6xl px-4 pt-4 sm:px-6">
          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-wv-muted">
            {stepLabel}
          </span>
        </div>
      )}

      <main id="product-tour-main" className="relative z-10 pb-24">
        {children}
      </main>
    </div>
  );
}
