"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type WvLoadingStateProps = {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
};

const sizeMap = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function WvLoadingState({
  label = "Loading…",
  className,
  size = "md",
  fullPage = false,
}: WvLoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-wv-muted",
        fullPage && "min-h-[40vh]",
        className,
      )}
    >
      <Loader2 className={cn("animate-spin text-wv-brand-blue", sizeMap[size])} />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

/** Skeleton block for card/list loading placeholders */
export function WvSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-wv-surface ring-1 ring-wv-border",
        className,
      )}
    />
  );
}
