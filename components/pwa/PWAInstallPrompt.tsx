"use client";

/**
 * PWA install prompt — intentionally inactive.
 * No beforeinstallprompt listener or preventDefault(); browser uses native install flow.
 * Service worker and manifest.json are unchanged.
 */
export function PWAInstallPrompt() {
  return null;
}
