"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "wv_hiring_coach_v1_done";

const STEPS = [
  {
    title: "Trust score",
    body: "This is your Trust Score — it shows how reliable a candidate is.",
  },
  {
    title: "Confidence",
    body: "Confidence tells you how much data supports this score.",
  },
  {
    title: "Insights",
    body: "Use insights to quickly understand strengths and risks.",
  },
  {
    title: "Next steps",
    body: "Take action here — request references or move forward.",
  },
];

type HiringGuidanceCoachmarksProps = {
  /** Only run for employer candidate review */
  enabled: boolean;
};

export function HiringGuidanceCoachmarks({ enabled }: HiringGuidanceCoachmarksProps) {
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(true);
    }
  }, [enabled]);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, []);

  const next = useCallback(() => {
    if (step >= STEPS.length - 1) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  }, [step, finish]);

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  if (!enabled || !ready || dismissed) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-x-0 bottom-0 z-[95] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none">
      <div
        className="pointer-events-auto mx-auto max-w-lg rounded-2xl border border-indigo-200 bg-white shadow-xl px-4 py-4"
        role="dialog"
        aria-labelledby="coach-title"
        aria-describedby="coach-body"
      >
        <div className="flex gap-2 mb-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-indigo-600" : "bg-slate-200"}`}
            />
          ))}
        </div>
        <h3 id="coach-title" className="text-base font-semibold text-slate-900">
          {current.title}
        </h3>
        <p id="coach-body" className="text-sm text-slate-600 mt-1">
          {current.body}
        </p>
        <div className="flex justify-between items-center mt-4 gap-2">
          <button type="button" onClick={skip} className="text-sm text-slate-500 hover:text-slate-700">
            Skip
          </button>
          <button
            type="button"
            onClick={next}
            className="rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700"
          >
            {step >= STEPS.length - 1 ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
