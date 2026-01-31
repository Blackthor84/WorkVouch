"use client";

import { useState, useEffect, useRef } from "react";

interface InvestorModePanelProps {
  open: boolean;
  onClose: () => void;
  simulationMode: boolean;
}

function AnimatedMetric({ end, prefix = "", suffix = "", decimals = 0 }: { end: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [value, setValue] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const duration = 1500;
    const startTime = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 2);
      setValue(end * eased);
      if (t >= 1) done.current = true;
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [end]);

  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
  return <span>{prefix}{display}{suffix}</span>;
}

export function InvestorModePanel({ open, onClose, simulationMode }: InvestorModePanelProps) {
  const [mrr, setMrr] = useState(124000);

  useEffect(() => {
    if (!open || !simulationMode) return;
    const id = setInterval(() => {
      setMrr((prev) => prev + Math.round((Math.random() - 0.3) * 2000));
    }, 3000);
    return () => clearInterval(id);
  }, [open, simulationMode]);

  if (!open) return null;

  return (
    <div className="fixed top-4 right-4 z-[9998] w-72 rounded-2xl bg-white shadow-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Investor Mode</span>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">Close</button>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">MRR</span>
          <span className="font-bold text-slate-900"><AnimatedMetric end={mrr} prefix="$" /></span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Growth</span>
          <span className="font-bold text-slate-900"><AnimatedMetric end={18.4} suffix="%" decimals={1} /></span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">LTV</span>
          <span className="font-bold text-slate-900"><AnimatedMetric end={2840} prefix="$" /></span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">CAC</span>
          <span className="font-bold text-slate-900"><AnimatedMetric end={420} prefix="$" /></span>
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-200">
          <span className="text-slate-500">Projected ARR</span>
          <span className="font-bold text-emerald-600"><AnimatedMetric end={1488000} prefix="$" /></span>
        </div>
      </div>
    </div>
  );
}
