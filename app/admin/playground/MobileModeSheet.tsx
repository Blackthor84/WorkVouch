"use client";

import type { DockMode } from "./ActionDock";

type Props = {
  mode: DockMode;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function MobileModeSheet({ mode, title, onClose, children }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white"
      role="dialog"
      aria-label={`${title} — full-height sheet`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 shrink-0">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </div>
  );
}
