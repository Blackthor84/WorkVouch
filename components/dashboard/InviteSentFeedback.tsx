"use client";

import { cn } from "@/lib/utils";

/**
 * Instant feedback after sending a coworker invite. Wire `show` from invite success state when ready.
 */
export function InviteSentFeedback({
  show = false,
  className,
}: {
  show?: boolean;
  className?: string;
}) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "text-sm text-green-600 dark:text-green-400 mt-2",
        className
      )}
      role="status"
    >
      Invite sent — once they confirm, your trust score increases 🔥
    </div>
  );
}
