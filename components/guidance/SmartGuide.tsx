"use client";

import { useCallback, useEffect, useState } from "react";
import { XMarkIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const SECTIONS: { title: string; body: string | string[] }[] = [
  {
    title: "Trust score",
    body: "Trust score measures how reliable and verified a candidate's work history is.",
  },
  {
    title: "Confidence",
    body: "Confidence shows how much data supports this score. More verified and recent signals increase confidence.",
  },
  {
    title: "Risk level",
    body: "Risk reflects missing data, inconsistencies, or lack of verification.",
  },
  {
    title: "What makes a strong candidate",
    body: [
      "Verified by supervisors",
      "Consistent job history",
      "Positive peer feedback",
      "Recent activity",
    ],
  },
  {
    title: "How to improve a profile",
    body: [
      "Request supervisor verification",
      "Add recent coworker feedback",
      "Complete missing job history",
    ],
  },
];

export function SmartGuide({
  variant = "default",
  className,
}: {
  variant?: "light" | "default";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
          variant === "light"
            ? "text-white/90 hover:bg-white/15 ring-1 ring-white/25"
            : "text-slate-600 hover:bg-slate-100 ring-1 ring-slate-200",
          className
        )}
        aria-expanded={open}
        aria-controls="hiring-intelligence-guide-panel"
      >
        <QuestionMarkCircleIcon className="h-5 w-5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Guide</span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[1px]"
            aria-label="Close guide"
            onClick={close}
          />
          <aside
            id="hiring-intelligence-guide-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="smart-guide-title"
            className="fixed right-0 top-0 z-[101] flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 id="smart-guide-title" className="text-lg font-semibold text-slate-900">
                Hiring Intelligence Guide
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {SECTIONS.map((s) => (
                <section key={s.title}>
                  <h3 className="text-sm font-semibold text-slate-900">{s.title}</h3>
                  {Array.isArray(s.body) ? (
                    <ul className="mt-2 list-disc list-inside text-sm text-slate-600 space-y-1">
                      {s.body.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.body}</p>
                  )}
                </section>
              ))}
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
