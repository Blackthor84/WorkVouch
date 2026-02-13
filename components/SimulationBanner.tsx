"use client";

import { useEffect } from "react";
import { useSupabaseSession } from "@/lib/hooks/useSupabaseSession";
import { usePreview, saveEliteStateToStorage } from "@/lib/preview-context";

const BODY_DEMO_CLASS = "workvouch-elite-demo-active";

function isPreviewAdmin(session: { user?: { role?: string; roles?: string[] } } | null): boolean {
  if (!session?.user) return false;
  const roles = session.user.roles ?? (session.user.role ? [session.user.role] : []);
  return roles.includes("admin") || roles.includes("superadmin");
}

export default function SimulationBanner() {
  const { data: session } = useSession();
  const { preview, setPreview } = usePreview();

  useEffect(() => {
    const active = Boolean(preview?.demoActive || preview?.role);
    if (active) {
      document.body.classList.add(BODY_DEMO_CLASS);
    } else {
      document.body.classList.remove(BODY_DEMO_CLASS);
    }
    return () => {
      document.body.classList.remove(BODY_DEMO_CLASS);
    };
  }, [preview?.demoActive, preview?.role]);

  if (!preview) return null;

  const adminPreview = isPreviewAdmin(session as { user?: { role?: string; roles?: string[] } } | null);
  if (!adminPreview) return null;

  const handleExit = () => {
    saveEliteStateToStorage(null);
    setPreview(null);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-slate-800 text-white text-sm border-b border-slate-600">
      <span className="font-medium">Preview Mode Active — Simulation Only</span>
      <button
        type="button"
        className="px-3 py-1.5 rounded-md bg-slate-600 hover:bg-slate-500 text-white font-medium"
        onClick={handleExit}
      >
        Exit Preview
      </button>
    </div>
  );
}
