"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

type WvSuccessStateProps = {
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
};

export function WvSuccessState({
  title,
  message,
  action,
  className,
}: WvSuccessStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-emerald-200">{title}</h3>
      {message && <p className="mt-2 max-w-md text-sm text-emerald-300/90">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
