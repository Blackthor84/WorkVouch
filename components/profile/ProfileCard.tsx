"use client";

import { cn } from "@/lib/utils";

export interface ProfileCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function ProfileCard({ children, className, hover = false }: ProfileCardProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50",
        hover && "transition-shadow duration-200 hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ProfileCardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-base font-semibold text-[#1E293B] dark:text-slate-200", className)}>
      {children}
    </h3>
  );
}

export function ProfileCardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400", className)}>{children}</div>;
}
