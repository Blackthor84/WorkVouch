"use client";

import { useState, useEffect } from "react";

function CircularProgress({ value, size = 80, strokeWidth = 6 }: { value: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-slate-200" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-emerald-500 transition-all duration-1000 ease-out" />
    </svg>
  );
}

interface WorkerDemoProps {
  userName: string;
  simulationMode: boolean;
}

export function WorkerDemo({ userName, simulationMode }: WorkerDemoProps) {
  const [trustScore, setTrustScore] = useState(0);
  const [rehirePct, setRehirePct] = useState(0);
  const [referenceCount, setReferenceCount] = useState(12);
  const displayName = userName.trim() || "Jane Doe";

  useEffect(() => {
    const duration = 1200;
    const startTime = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 2);
      setTrustScore(Math.round(782 * eased));
      setRehirePct(Math.round(82 * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!simulationMode) return;
    const id = setInterval(() => {
      setTrustScore((s) => Math.min(1000, Math.max(600, s + (Math.random() - 0.5) * 20)));
      setRehirePct((p) => Math.min(98, Math.max(70, p + (Math.random() - 0.5) * 4)));
      setReferenceCount((c) => Math.min(20, Math.max(8, c + (Math.random() > 0.7 ? 1 : 0))));
    }, 3000);
    return () => clearInterval(id);
  }, [simulationMode]);

  const pct = trustScore > 0 ? (trustScore / 1000) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Profile Card</h3>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{displayName}</p>
              <p className="text-sm text-slate-500">Verified Professional</p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Verification Badge
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Reference count</p>
          <p className="text-2xl font-bold text-slate-900">{referenceCount}</p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="flex flex-col items-center">
          <p className="text-sm font-medium text-slate-500 mb-2">Reputation Score</p>
          <div className="relative">
            <CircularProgress value={pct} size={120} strokeWidth={8} />
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-900">{trustScore}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm w-full max-w-xs text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">Rehire Probability</p>
          <p className="text-3xl font-bold text-indigo-600">{rehirePct}%</p>
        </div>
      </div>
    </div>
  );
}
