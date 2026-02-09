"use client";

import { getVerticalBadgesForProfile } from "@/lib/verticals/badges";
import { Badge } from "@/components/ui/badge";

interface VerticalBadgesProps {
  profile: {
    industry?: string | null;
    vertical?: string | null;
    vertical_metadata?: Record<string, unknown> | null;
  };
  className?: string;
}

/** Renders vertical-specific badges (e.g. Multi-Year Educator, OSHA Certified). Display only; does not affect scoring. */
export function VerticalBadges({ profile, className = "" }: VerticalBadgesProps) {
  const badges = getVerticalBadgesForProfile(profile);
  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {badges.map((badge) => (
        <Badge
          key={badge.key}
          variant="secondary"
          className="bg-blue-500/20 text-blue-200 border border-blue-500/40"
        >
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}
