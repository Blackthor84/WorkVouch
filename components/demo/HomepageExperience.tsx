"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { DemoTabs, type DemoTab } from "./DemoTabs";
import { WorkerDemo } from "./WorkerDemo";
import { EmployerDemo } from "./EmployerDemo";
import { AdvertiserDemo } from "./AdvertiserDemo";
import { WalkthroughOverlay } from "./WalkthroughOverlay";
import { InvestorModePanel } from "./InvestorModePanel";

interface StatConfig {
  end: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
}

const STATS: StatConfig[] = [
  { end: 12482, label: "Verified Profiles" },
  { end: 3914, label: "Employers" },
  { end: 97.6, suffix: "%", decimals: 1, label: "Verification Accuracy" },
  { end: 842000, prefix: "$", label: "Revenue Protected" },
];

function AnimatedCounter({ end, prefix = "", suffix = "", decimals = 0 }: { end: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [value, setValue] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const duration = 1800;
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

export default function HomepageExperience() {
  const [tab, setTab] = useState<DemoTab>("worker");
  const [userName, setUserName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [simulationMode, setSimulationMode] = useState(false);
  const [investorMode, setInvestorMode] = useState(false);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [impressions, setImpressions] = useState(50000);

  return (
    <section className="bg-slate-50 border-y border-slate-200/80 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Trust. Verified. Instantly.
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
            See how WorkVouch transforms reputation into opportunity.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  <AnimatedCounter end={stat.end} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} />
                </p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-xl mx-auto mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="demo-name" className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
            <input
              id="demo-name"
              type="text"
              placeholder="e.g. Jane Doe"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="demo-company" className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
            <input
              id="demo-company"
              type="text"
              placeholder="e.g. Acme Inc"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={simulationMode}
              onChange={(e) => setSimulationMode(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-slate-700">Live Simulation Mode</span>
          </label>
          <button
            type="button"
            onClick={() => setInvestorMode((v) => !v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${investorMode ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
          >
            Investor Mode
          </button>
          <button
            type="button"
            onClick={() => setWalkthroughOpen(true)}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            Take 60-Second Guided Tour
          </button>
        </div>

        <DemoTabs tab={tab} setTab={setTab} />

        <div key={tab} className="rounded-3xl bg-white shadow-lg border border-slate-200/80 p-8 sm:p-10 mb-12 mt-8">
          {tab === "worker" && <WorkerDemo userName={userName} simulationMode={simulationMode} />}
          {tab === "employer" && <EmployerDemo companyName={companyName} simulationMode={simulationMode} />}
          {tab === "advertiser" && <AdvertiserDemo impressions={impressions} setImpressions={setImpressions} simulationMode={simulationMode} />}
        </div>

        <div className="text-center">
          <p className="text-slate-600 mb-6">Ready to stand out?</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
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

      <WalkthroughOverlay open={walkthroughOpen} onClose={() => setWalkthroughOpen(false)} />
      <InvestorModePanel open={investorMode} onClose={() => setInvestorMode(false)} simulationMode={simulationMode} />
    </section>
  );
}
