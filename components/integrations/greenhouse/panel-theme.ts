/** Shared styles for Greenhouse embedded panel — light, native feel. */
export const ghPanel = {
  shell: "min-h-screen bg-[#f8f9fb] text-[#15372c] antialiased",
  card: "rounded-lg border border-[#e1e6e4] bg-white shadow-sm",
  cardPadding: "p-4",
  muted: "text-[#5c6c66]",
  subtle: "text-[#8a9690]",
  heading: "text-sm font-semibold text-[#15372c]",
  divider: "border-t border-[#e1e6e4]",
  brand: "text-[#047957]",
  focusRing: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047957] focus-visible:ring-offset-2",
} as const;

export function formatPanelRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatConfidence(pct: number): string {
  return `${Math.round(pct * 100)}%`;
}
