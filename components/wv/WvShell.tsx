"use client";

import { cn } from "@/lib/utils";

type WvShellProps = {
  children: React.ReactNode;
  className?: string;
  /** Show ambient gradient mesh (default true for marketing/auth) */
  ambient?: boolean;
  /** Show subtle grid overlay */
  grid?: boolean;
};

/** Full-page dark canvas with optional ambient lighting — matches Live Demo. */
export function WvShell({ children, className, ambient = true, grid = true }: WvShellProps) {
  return (
    <div className={cn("relative min-h-screen bg-wv-bg text-wv-foreground overflow-x-hidden", className)}>
      {ambient && (
        <div className="pointer-events-none fixed inset-0" aria-hidden>
          <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-blue-600/15 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/8 blur-[80px]" />
        </div>
      )}
      {grid && (
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.025]"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** Constrained content width used on every page. */
export function WvContainer({
  children,
  className,
  size = "default",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "narrow" | "default" | "wide";
}) {
  const maxW = size === "narrow" ? "max-w-3xl" : size === "wide" ? "max-w-7xl" : "max-w-6xl";
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", maxW, className)}>{children}</div>
  );
}
