/**
 * Usage limits (candidate views, exports). Enforce after checking plan entitlements.
 */
export function canConsumeUsage(used: number, limit: number): boolean {
  if (limit === Infinity) return true;
  return used < limit;
}
