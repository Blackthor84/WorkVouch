"use client";

import { useEffect, useRef, useState } from "react";
import { consumeInviteTokenFromStorage } from "@/components/invites/CoworkerInvitePanel";

/**
 * One-shot: claim coworker invite after login using token from signup flow or sessionStorage.
 */
export function ClaimCoworkerInviteBootstrap() {
  const done = useRef(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (done.current) return;
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    if (path.startsWith("/login") || path.startsWith("/signup")) return;

    const run = async () => {
      const fromStorage = consumeInviteTokenFromStorage();
      try {
        const res = await fetch("/api/invites/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fromStorage ? { token: fromStorage } : {}),
        });
        const data = await res.json().catch(() => ({}));
        if (data.ok === true && data.inviterName) {
          setToast(`You're now connected with ${data.inviterName} — add a matching job to unlock your coworker match.`);
        }
      } catch {
        /* ignore */
      } finally {
        done.current = true;
      }
    };

    void run();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-[100] max-w-md -translate-x-1/2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-lg dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100"
    >
      {toast}
    </div>
  );
}
