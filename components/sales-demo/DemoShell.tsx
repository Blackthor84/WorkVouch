"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type DemoShellProps = {
  children: React.ReactNode;
  flow?: "employee" | "employer" | "landing";
  step?: number;
  totalSteps?: number;
  stepLabel?: string;
};

export function DemoBanner() {
  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-center text-sm font-medium text-white">
      Interactive Sales Demo — Sample data only · No account required
    </div>
  );
}

export function DemoShell({
  children,
  flow,
  step,
  totalSteps,
  stepLabel,
}: DemoShellProps) {
  const progress =
    step != null && totalSteps != null && totalSteps > 0
      ? Math.round((step / totalSteps) * 100)
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30">
      <DemoBanner />
      <header className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/experience" className="flex items-center gap-2 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-600/25 group-hover:bg-blue-700 transition-colors">
              WV
            </span>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900 leading-tight">
                WorkVouch
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-blue-600">
                Live Demo
              </p>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            {(
              [
                { href: "/experience", label: "Home", active: flow === "landing" },
                {
                  href: "/experience/employee",
                  label: "Employee",
                  active: flow === "employee",
                },
                {
                  href: "/experience/employer",
                  label: "Employer",
                  active: flow === "employer",
                },
              ] as const
            ).map(({ href, label, active }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        {progress != null && stepLabel && (
          <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-2">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                <span className="font-medium">{stepLabel}</span>
                <span>
                  Step {step} of {totalSteps}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
    </div>
  );
}
