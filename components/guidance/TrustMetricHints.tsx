import { cn } from "@/lib/utils";

/** One-line hints for trust / confidence / risk UI — use under labels. */
export function TrustScoreHint({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-slate-500 mt-1", className)}>
      Based on verified experience, reviews, and consistency.
    </p>
  );
}

export function ConfidenceHint({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-slate-500 mt-1", className)}>
      High confidence = strong, recent data.
    </p>
  );
}

export function RiskHint({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-slate-500 mt-1", className)}>
      Lower risk means fewer unknowns.
    </p>
  );
}
