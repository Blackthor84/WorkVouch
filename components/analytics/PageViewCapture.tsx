"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Sends a page view to internal analytics. No PII. Session from cookie (httpOnly).
 * Fires on pathname change. Credentials included so server can read session.
 */
export function PageViewCapture() {
  const pathname = usePathname();
  const sent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/api") || pathname.startsWith("/_next")) return;
    if (sent.current === pathname) return;
    sent.current = pathname;

    const referrer = typeof document !== "undefined" ? document.referrer || "" : "";
    fetch("/api/analytics/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ path: pathname, referrer: referrer.slice(0, 2048) }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
