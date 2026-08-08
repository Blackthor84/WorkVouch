"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { fadeUp } from "./motion";

type WvEmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
};

export function WvEmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: WvEmptyStateProps) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ duration: 0.35 }}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-wv-border bg-wv-surface/50 text-center",
        compact ? "px-4 py-8" : "px-6 py-12",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-wv-surface text-wv-muted ring-1 ring-wv-border">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-wv-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-wv-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
