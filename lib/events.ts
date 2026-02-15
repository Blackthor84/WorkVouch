"use client";

/**
 * Log a discrete event to site_events. Requires session_id in sessionStorage (set when session is created).
 * Fire-and-forget; safe to call from client components.
 */
export function logEvent(event: string, path: string) {
  const sessionId = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("session_id") ?? "" : "";
  fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-session-id": sessionId,
    },
    body: JSON.stringify({ event, path }),
  }).catch(() => {});
}
