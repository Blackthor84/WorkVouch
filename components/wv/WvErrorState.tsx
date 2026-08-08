"use client";

import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { WvButton } from "./WvButton";

type WvErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function WvErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  className,
}: WvErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-300">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-red-200">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-red-300/90">{message}</p>
      {onRetry && (
        <div className="mt-6">
          <WvButton variant="danger" size="sm" onClick={onRetry}>
            {retryLabel}
          </WvButton>
        </div>
      )}
    </div>
  );
}
