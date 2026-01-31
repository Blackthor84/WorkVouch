"use client";

import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

interface AdvertiserDemoProps {
  impressions: number;
  setImpressions: Dispatch<SetStateAction<number>>;
  simulationMode: boolean;
}

const CTR = 3.2;

export function AdvertiserDemo({ impressions, setImpressions, simulationMode }: AdvertiserDemoProps) {
  const [displayImpressions, setDisplayImpressions] = useState(impressions);

  useEffect(() => {
    setDisplayImpressions(impressions);
  }, [impressions]);

  useEffect(() => {
    if (!simulationMode) return;
    const id = setInterval(() => {
      setImpressions((prev) => Math.min(200000, Math.max(10000, prev + Math.round((Math.random() - 0.5) * 8000))));
    }, 3000);
    return () => clearInterval(id);
  }, [simulationMode, setImpressions]);

  const clicks = Math.round((displayImpressions * CTR) / 100);
  const revenue = clicks * 4;
  const roi = revenue / 1000;
  const conversionPct = CTR * 1.2;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Impressions</label>
        <input
          type="range"
          min={5000}
          max={200000}
          step={1000}
          value={displayImpressions}
          onChange={(e) => {
            const v = Number(e.target.value);
            setImpressions(v);
            setDisplayImpressions(v);
          }}
          className="w-full h-2 rounded-full appearance-none bg-slate-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <p className="text-2xl font-bold text-slate-900 mt-2">{displayImpressions.toLocaleString()}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">CTR %</p>
          <p className="text-xl font-bold text-slate-900">{CTR}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Conversion %</p>
          <p className="text-xl font-bold text-slate-900">{conversionPct.toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Projected ROI</p>
          <p className="text-xl font-bold text-emerald-600">{roi.toFixed(1)}x</p>
        </div>
      </div>
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
        <p className="text-sm font-medium text-indigo-800">Estimated revenue</p>
        <p className="text-2xl font-bold text-indigo-600">${revenue.toLocaleString()}</p>
      </div>
    </div>
  );
}
