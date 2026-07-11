import { cn } from "@/lib/utils";

type WvBadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "brand";
  className?: string;
};

export function WvBadge({ children, variant = "default", className }: WvBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variant === "default" && "bg-wv-surface border border-wv-border text-wv-muted",
        variant === "success" && "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300",
        variant === "warning" && "bg-amber-500/15 border border-amber-500/30 text-amber-300",
        variant === "danger" && "bg-red-500/15 border border-red-500/30 text-red-300",
        variant === "brand" && "bg-blue-500/15 border border-blue-500/30 text-blue-300",
        className,
      )}
    >
      {children}
    </span>
  );
}
