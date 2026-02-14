/**
 * Core coworker matching rules. Same logic in sandbox and production.
 */

export const MIN_OVERLAP_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function overlapDays(
  start1: Date,
  end1: Date | null,
  start2: Date,
  end2: Date | null
): number {
  const e1 = (end1 ?? new Date()).getTime();
  const e2 = (end2 ?? new Date()).getTime();
  const overlapStart = Math.max(start1.getTime(), start2.getTime());
  const overlapEnd = Math.min(e1, e2);
  if (overlapEnd <= overlapStart) return 0;
  return (overlapEnd - overlapStart) / MS_PER_DAY;
}

export function confidenceFromOverlapDays(days: number): number {
  if (days < MIN_OVERLAP_DAYS) return 0;
  const capped = Math.min(days, 365 * 2);
  return Math.min(1, capped / 365);
}
