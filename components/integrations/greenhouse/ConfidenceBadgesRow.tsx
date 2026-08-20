"use client";

import type { ConfidenceBadge } from "@/lib/trust/confidence/types";
import { ghPanel } from "./panel-theme";

interface ConfidenceBadgesRowProps {
  badges: ConfidenceBadge[];
}

export function ConfidenceBadgesRow({ badges }: ConfidenceBadgesRowProps) {
  const earned = badges.filter((b) => b.earned);
  if (earned.length === 0) return null;

  return (
    <section className={`${ghPanel.card} ${ghPanel.cardPadding}`} aria-label="Earned confidence badges">
      <h2 className={ghPanel.heading}>Badges</h2>
      <ul className="mt-2 flex flex-wrap gap-1.5" role="list">
        {earned.map((badge) => (
          <li
            key={badge.id}
            className="rounded-full bg-[#e6f4ef] px-2.5 py-1 text-[10px] font-semibold text-[#047957]"
          >
            {badge.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
