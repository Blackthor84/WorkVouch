"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const SANDBOX_IMPERSONATION_KEY = "sandbox_playground_impersonation";

type Stored = { type: string; id: string; name: string; sandboxId: string } | null;

export function SandboxImpersonationBanner() {
  const [impersonation, setImpersonation] = useState<Stored>(null);

  useEffect(() => {
    const read = () => {
      try {
        const raw = typeof window !== "undefined" ? window.sessionStorage?.getItem(SANDBOX_IMPERSONATION_KEY) : null;
        if (!raw) {
          setImpersonation(null);
          return;
        }
        const parsed = JSON.parse(raw) as Stored;
        if (parsed && parsed.sandboxId && parsed.id && parsed.name) setImpersonation(parsed);
        else setImpersonation(null);
      } catch {
        setImpersonation(null);
      }
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener("sandbox-impersonation-change", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("sandbox-impersonation-change", read);
    };
  }, []);

  const exit = () => {
    if (typeof window !== "undefined") window.sessionStorage?.removeItem(SANDBOX_IMPERSONATION_KEY);
    setImpersonation(null);
  };

  if (!impersonation) return null;

  return (
    <div
      className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b-2 border-amber-400 bg-amber-100 px-4 py-2 text-sm text-amber-900"
      role="status"
      aria-label="Sandbox impersonation active"
    >
      <span className="font-medium">You are impersonating a sandbox user: {impersonation.name}</span>
      <Button variant="outline" size="sm" onClick={exit}>
        Exit impersonation
      </Button>
    </div>
  );
}
