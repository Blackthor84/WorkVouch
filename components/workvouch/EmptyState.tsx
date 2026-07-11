"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-wv-border bg-wv-surface/50 px-6 py-12 text-center",
        className
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
    </div>
  );
}
