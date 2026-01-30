"use client";

import { useEffect } from "react";
import { usePreview, saveEliteStateToStorage } from "@/lib/preview-context";

const BODY_DEMO_CLASS = "workvouch-elite-demo-active";

export default function SimulationBanner() {
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

  const isElite = Boolean(preview.demoActive);

  const handleExit = () => {
    saveEliteStateToStorage(null);
    setPreview(null);
  };

  return (
    <div
      className={
        isElite
          ? "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-gradient-to-r from-violet-900/95 to-purple-900/95 text-white text-sm border-b border-violet-400/50 shadow-lg shadow-violet-500/20"
          : "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-black text-white text-sm"
      }
    >
      <span className="font-medium">
        {isElite
          ? "Elite Demo Mode Active"
          : `Simulation — Role: ${preview.role ?? "—"} | Plan: ${preview.subscription ?? "—"}`}
      </span>
      <button
        className={
          isElite
            ? "px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white font-medium"
            : "bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white"
        }
        onClick={handleExit}
      >
        Exit {isElite ? "Demo" : "Simulation"}
      </button>
    </div>
  );
}
