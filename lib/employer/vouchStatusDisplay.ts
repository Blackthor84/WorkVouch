export type VouchUiTier = "no_vouch" | "one_vouch" | "verified" | "trusted";

export function vouchDisplayFromCount(vouchCount: number): {
  badge: string;
  statusLine: string;
  tier: VouchUiTier;
} {
  const n = Math.max(0, Math.floor(Number(vouchCount) || 0));
  if (n <= 0) {
    return { badge: "No Vouch", statusLine: "", tier: "no_vouch" };
  }
  if (n === 1) {
    return { badge: "1 Vouch", statusLine: "🟡 1 Vouch", tier: "one_vouch" };
  }
  if (n < 5) {
    return { badge: "Verified", statusLine: "🟢 Verified (2+)", tier: "verified" };
  }
  return { badge: "Trusted", statusLine: "🔥 Trusted (5+)", tier: "trusted" };
}
