"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Tab = "worker" | "employer" | "advertiser";

interface CounterConfig {
  end: number;
  suffix: string;
  prefix?: string;
  decimals?: number;
}

function AnimatedCounter({ end, suffix, prefix = "", decimals = 0 }: CounterConfig) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (!ref.current || animated.current) return;
    const duration = 1800;
    const startTime = Date.now();
    const start = 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 2);
      const current = start + (end - start) * eased;
      setValue(current);
      if (t < 1) requestAnimationFrame(tick);
      else animated.current = true;
    };
    requestAnimationFrame(tick);
  }, [end]);

  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
  return (
    <span ref={ref}>
      {prefix}{display}{suffix}
    </span>
  );
}

function CircularProgress({ value, size = 80, strokeWidth = 6 }: { value: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-slate-200" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-emerald-500 transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: "worker", label: "Worker Experience" },
  { id: "employer", label: "Employer Intelligence" },
  { id: "advertiser", label: "Advertiser ROI" },
];

const STATS: (CounterConfig & { label: string })[] = [
  { end: 12482, suffix: "", prefix: "", label: "Verified Profiles" },
  { end: 3914, suffix: "", prefix: "", label: "Employers" },
  { end: 97.6, suffix: "%", prefix: "", decimals: 1, label: "Verification Accuracy" },
  { end: 842000, suffix: "", prefix: "$", label: "Revenue Protected" },
];

export default function HomepageInteractiveDemo() {
  const [tab, setTab] = useState<Tab>("worker");
  const [impressions, setImpressions] = useState(50000);
  const [trustScore, setTrustScore] = useState(0);
  const [rehirePct, setRehirePct] = useState(0);

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

  const ctr = 2.5;
  const clicks = Math.round((impressions * ctr) / 100);
  const revenue = clicks * 4;
  const roi = revenue / 1000;

  return (
    <section className="bg-slate-50 border-y border-slate-200/80 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Animated Impact Header */}
        <div className="text-center mb-14">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Trust. Verified. Instantly.
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-12">
            See how WorkVouch transforms reputation into opportunity.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  <AnimatedCounter {...stat} />
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {stat.suffix.replace(/^[\d$%\s]+/, "").trim() || stat.suffix}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ease-in-out",
                tab === t.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content with slight upward fade on switch */}
        <div
          key={tab}
          className="rounded-3xl bg-white shadow-lg border border-slate-200/80 p-8 sm:p-10 mb-12 transition-all duration-500 ease-in-out opacity-100"
          style={{ animation: "fadeSlideUp 0.5s ease-out" }}
        >
          {/* Worker Experience */}
          {tab === "worker" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Profile Card</h3>
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                      JD
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Jane Doe</p>
                      <p className="text-sm text-slate-500">Verified Professional</p>
                    </div>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-700 transition-opacity duration-500 opacity-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Verification Badge
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 mb-1">Reference count</p>
                  <p className="text-2xl font-bold text-slate-900">12</p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium text-slate-500 mb-2">Reputation Score</p>
                  <div className="relative">
                    <CircularProgress value={trustScore > 0 ? (trustScore / 1000) * 100 : 0} size={120} strokeWidth={8} />
                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-900">
                      {trustScore}
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm w-full max-w-xs text-center">
                  <p className="text-sm font-medium text-slate-500 mb-1">Rehire Probability</p>
                  <p className="text-3xl font-bold text-indigo-600">{rehirePct}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Employer Intelligence */}
          {tab === "employer" && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Active Employees", value: "24" },
                  { label: "Verification Pending", value: "3" },
                  { label: "Reports Used", value: "28" },
                  { label: "Plan Limit", value: "40" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{item.label}</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-3">Reports used vs plan limit</p>
                <div className="h-4 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-1000 ease-out"
                    style={{ width: "70%" }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">28 / 40</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-4">Fit Score preview</p>
                <div className="h-32 flex items-end gap-1">
                  {[40, 65, 55, 80, 70, 90, 75, 85, 78, 88].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-indigo-500 to-indigo-400 min-w-[8px] transition-all duration-500 ease-out"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">Last 10 candidates</p>
              </div>
            </div>
          )}

          {/* Advertiser ROI */}
          {tab === "advertiser" && (
            <div className="max-w-2xl mx-auto space-y-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Impressions</label>
                <input
                  type="range"
                  min={5000}
                  max={200000}
                  step={1000}
                  value={impressions}
                  onChange={(e) => setImpressions(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none bg-slate-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <p className="text-2xl font-bold text-slate-900 mt-2">{impressions.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">CTR %</p>
                  <p className="text-xl font-bold text-slate-900">{ctr}%</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">Est. Conversions</p>
                  <p className="text-xl font-bold text-slate-900">{clicks.toLocaleString()}</p>
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
          )}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <p className="text-slate-600 mb-6">Ready to stand out?</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3.5 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-in-out"
            >
              Start Building Your Verified Reputation
            </Link>
            <Link
              href="/employer/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold px-8 py-3.5 border border-slate-300 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-in-out"
            >
              Explore Employer Tools
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
