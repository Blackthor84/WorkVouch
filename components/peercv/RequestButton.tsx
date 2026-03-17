"use client";

import { cn } from "@/lib/utils";

type Status = "default" | "pending" | "accepted";

export function RequestButton({
  status = "default",
  loading,
  onClick,
  className,
}: {
  status?: Status;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  if (status === "accepted") {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors",
          className
        )}
      >
        Accepted
      </button>
    );
  }

  if (status === "pending") {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors",
          className
        )}
      >
        {loading ? "Sending…" : "Pending…"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {loading ? "Sending…" : "Request Reference"}
    </button>
  );
}
