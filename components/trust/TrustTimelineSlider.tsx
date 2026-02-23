"use client";

import type { TrustSnapshot } from "@/lib/trust/types";

type TrustTimelineSliderProps = {
  timeline: TrustSnapshot[];
  index: number;
  onIndexChange: (index: number) => void;
};

/** Slider maps to timeline[index]. Before/after time-travel for trust score. */
export function TrustTimelineSlider({
  timeline,
  index,
  onIndexChange,
}: TrustTimelineSliderProps) {
  if (!timeline.length) return null;

  const snapshot = timeline[index] ?? timeline[timeline.length - 1];
  const max = Math.max(0, timeline.length - 1);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Trust score over time</span>
        <span className="text-slate-600">
          {snapshot.trustScore} — {snapshot.reason}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={index}
        onChange={(e) => onIndexChange(Number(e.target.value))}
        className="w-full accent-slate-700"
      />
      <p className="text-xs text-slate-500">
        {index + 1} of {timeline.length}
      </p>
    </div>
  );
}
