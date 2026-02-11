"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("workvouch_pwa_prompt_dismissed");
    if (stored) setDismissed(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!dismissed) setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setShowPrompt(false);
    setDeferredPrompt(null);
    if (outcome === "accepted") localStorage.setItem("workvouch_pwa_prompt_dismissed", "1");
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("workvouch_pwa_prompt_dismissed", "1");
  };

  if (typeof window === "undefined" || !showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:max-w-sm rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
        Install WorkVouch for quick access
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={handleInstall} className="flex-1">
          Install
        </Button>
        <Button size="sm" variant="secondary" onClick={handleDismiss}>
          Not now
        </Button>
      </div>
    </div>
  );
}
