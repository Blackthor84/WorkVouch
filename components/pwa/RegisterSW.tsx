"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    // Temporarily disabled to isolate 401 / static asset issues.
    // Re-enable after confirming /manifest.json and /sw.js return 200.
    // if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    // window.addEventListener("load", () => {
    //   navigator.serviceWorker.register("/sw.js").catch(() => {});
    // });
  }, []);
  return null;
}
