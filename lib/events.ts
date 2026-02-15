"use client";

/**
 * Log an analytics event. Fire-and-forget; never throws.
 * Analytics must never break UX. Missing eventType is a no-op.
 */
export function logEvent(
  eventType: string,
  userId?: string | null,
  metadata?: Record<string, unknown>
): void {
  if (!eventType || typeof eventType !== "string") return;

  try {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        eventType: eventType.trim().slice(0, 256),
        userId: userId ?? null,
        metadata: metadata ?? {},
      }),
    }).catch(() => {});
  } catch {
    // analytics must fail silently
  }
}
