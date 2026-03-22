/** Normalize user input to E.164 when possible (US-focused). */
export function normalizeToE164(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (t.startsWith("+")) {
    const digits = t.slice(1).replace(/\D/g, "");
    return digits.length >= 10 ? `+${digits}` : null;
  }
  const digits = t.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/** Compare two phone strings loosely (last 10 digits in US). */
export function phonesLooselyMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const da = (a ?? "").replace(/\D/g, "");
  const db = (b ?? "").replace(/\D/g, "");
  if (da.length < 10 || db.length < 10) return false;
  const ta = da.length > 10 ? da.slice(-10) : da;
  const tb = db.length > 10 ? db.slice(-10) : db;
  return ta === tb;
}
