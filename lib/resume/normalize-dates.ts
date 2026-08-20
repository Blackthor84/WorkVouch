export function normalizeResumeDate(s: string | null | undefined): string | null {
  if (s == null || s === "") return null;
  const trimmed = String(s).trim();
  if (/^(present|current|now)$/i.test(trimmed)) return null;
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return trimmed;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
