import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const WvInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
>(function WvInput({ className, label, error, id, ...props }, ref) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-wv-muted">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "w-full rounded-xl border border-wv-border bg-wv-surface px-4 py-3 text-sm text-wv-foreground placeholder:text-white/30",
          "transition-colors focus:border-wv-brand-blue/50 focus:outline-none focus:ring-2 focus:ring-wv-brand-blue/30",
          "disabled:opacity-50",
          error && "border-red-500/50 focus:ring-red-500/30",
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
});
