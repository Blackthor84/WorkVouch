"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  UserCircleIcon,
  BriefcaseIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

type Step = "hero" | "role" | "dashboard" | "tour";
type Role = "worker" | "employer" | "advertiser";

interface TourItem {
  id: string;
  title: string;
  description: string;
}

const ROLE_TOUR: Record<Role, TourItem[]> = {
  worker: [
    { id: "demo-trust-score", title: "Reputation Score", description: "Your verified work reputation in one number. Employers use this to assess fit." },
    { id: "demo-profile", title: "Profile", description: "Complete your profile to increase visibility and trust." },
    { id: "demo-jobs", title: "Job History", description: "Add verified roles. Each verification strengthens your profile." },
    { id: "demo-activity", title: "Activity", description: "See references, matches, and messages in one place." },
  ],
  employer: [
    { id: "demo-stats", title: "Key Metrics", description: "Track candidates, applications, and saved profiles at a glance." },
    { id: "demo-actions", title: "Quick Actions", description: "Post jobs, search employees, request verifications." },
    { id: "demo-usage", title: "Usage", description: "Monitor reports and searches within your plan limits." },
    { id: "demo-activity", title: "Activity", description: "Recent applications and messages." },
  ],
  advertiser: [
    { id: "demo-impressions", title: "Impressions", description: "Reach candidates with career-targeted placements." },
    { id: "demo-ctr", title: "CTR & Clicks", description: "Track engagement and click-through rates." },
    { id: "demo-revenue", title: "Revenue", description: "Estimated revenue from your campaign." },
    { id: "demo-roi", title: "ROI", description: "Return on ad spend. Optimize and scale." },
  ],
};

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = Date.now();
    const step = () => {
      const t = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 2);
      setDisplay(Math.round(value * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);
  return <span>{display}</span>;
}

export default function PublicDemoWalkthrough() {
  const [step, setStep] = useState<Step>("hero");
  const [role, setRole] = useState<Role | null>(null);
  const [tourIndex, setTourIndex] = useState(0);
  const [trustScore] = useState(782);
  const [reportsUsed] = useState(24);
  const [searchesUsed] = useState(38);
  const [impressions] = useState(125000);
  const [clicks] = useState(3125);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const tourSteps = role ? ROLE_TOUR[role] : [];
  const currentTour = tourSteps[tourIndex];
  const isLastTour = tourIndex === tourSteps.length - 1;
  const isFirstTour = tourIndex === 0;

  const updateTargetRect = useCallback(() => {
    if (!currentTour) return;
    const el = document.getElementById(currentTour.id);
    setTargetRect(el ? el.getBoundingClientRect() : null);
  }, [currentTour]);

  useEffect(() => {
    if (step !== "tour") return;
    updateTargetRect();
    const onResize = () => updateTargetRect();
    const onScroll = () => updateTargetRect();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [step, updateTargetRect]);

  useEffect(() => {
    if (currentTour) {
      document.getElementById(currentTour.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentTour]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-[#0D1117] dark:to-[#161B22]">
      {/* Hero */}
      <section
        className={cn(
          "mx-auto max-w-4xl px-4 pt-16 pb-12 text-center transition-all duration-500",
          step !== "hero" && "opacity-0 absolute inset-0 pointer-events-none h-0 overflow-hidden"
        )}
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 dark:bg-blue-500/20 px-4 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 mb-8">
          <ShieldCheckIcon className="h-4 w-4" />
          No signup required
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-grey-dark dark:text-gray-100 tracking-tight mb-6">
          Experience WorkVouch Before You Sign Up
        </h1>
        <p className="text-lg sm:text-xl text-grey-medium dark:text-gray-400 max-w-2xl mx-auto mb-10">
          See how verification and reputation scores help workers showcase their history and employers hire with confidence. All data below is simulated.
        </p>
        <Button
          size="lg"
          className="text-lg px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
          onClick={() => setStep("role")}
        >
          Get Started
          <ArrowRightIcon className="ml-2 h-5 w-5 inline" />
        </Button>
      </section>

      {/* Role selection */}
      <section
        className={cn(
          "mx-auto max-w-5xl px-4 py-12 transition-all duration-500",
          step !== "role" && "opacity-0 absolute pointer-events-none h-0 overflow-hidden"
        )}
      >
        <p className="text-center text-grey-medium dark:text-gray-400 mb-8">Step 1 — Choose your role</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(
            [
              { id: "worker" as Role, label: "Worker", desc: "Verify your work history and build your reputation score.", icon: UserCircleIcon, color: "from-violet-500 to-violet-700" },
              { id: "employer" as Role, label: "Employer", desc: "Search candidates, request verifications, and hire with confidence.", icon: BriefcaseIcon, color: "from-blue-500 to-blue-700" },
              { id: "advertiser" as Role, label: "Advertiser", desc: "Reach candidates with career-targeted ads and track ROI.", icon: MegaphoneIcon, color: "from-amber-500 to-amber-700" },
            ] as const
          ).map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRole(r.id);
                  setStep("dashboard");
                  setTourIndex(0);
                }}
                className={cn(
                  "group text-left rounded-2xl border-2 border-grey-background dark:border-[#374151] bg-white dark:bg-[#1A1F2B] p-8 shadow-lg hover:shadow-xl hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all duration-300 hover:scale-[1.02]"
                )}
              >
                <div className={cn("rounded-xl bg-gradient-to-br p-3 w-fit text-white mb-6", r.color)}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">{r.label}</h3>
                <p className="text-sm text-grey-medium dark:text-gray-400">{r.desc}</p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:gap-2 gap-1 transition-all">
                  View demo
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Dashboard (simulated) */}
      <section
        className={cn(
          "mx-auto max-w-6xl px-4 py-12 transition-all duration-500",
          step !== "dashboard" && step !== "tour" && "opacity-0 absolute pointer-events-none h-0 overflow-hidden"
        )}
      >
        {(step === "dashboard" || step === "tour") && (
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <p className="text-grey-medium dark:text-gray-400">Step 2 — Simulated dashboard</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setStep("role")}
                className="text-sm font-medium text-grey-medium dark:text-gray-400 hover:text-grey-dark dark:hover:text-gray-200 transition-colors"
              >
                Choose different role
              </button>
              {step === "dashboard" && (
                <Button onClick={() => setStep("tour")}>
                  Start guided tour
                  <ArrowRightIcon className="ml-2 h-4 w-4 inline" />
                </Button>
              )}
            </div>
          </div>
        )}

        {role === "worker" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card id="demo-jobs" className="overflow-hidden transition-shadow hover:shadow-lg" hover>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Job History (simulated)</h2>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {[72, 85, 68].map((h, i) => (
                      <div key={i} className="flex-1 rounded-lg bg-violet-500/20 h-24 flex items-end justify-center pb-2" style={{ height: 96 }} />
                    ))}
                  </div>
                  <p className="text-xs text-grey-medium dark:text-gray-400 mt-2">Verified roles — fake data</p>
                </CardContent>
              </Card>
              <Card id="demo-activity">
                <CardHeader>
                  <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Recent Activity</h2>
                </CardHeader>
                <CardContent className="space-y-3">
                  {["New reference from John Doe", "Coworker match at ABC Security", "Message from employer"].map((msg, i) => (
                    <div key={i} className="flex gap-3 rounded-lg bg-grey-background dark:bg-[#0D1117] p-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                      <div>
                        <p className="text-sm text-grey-dark dark:text-gray-200">{msg}</p>
                        <p className="text-xs text-grey-medium dark:text-gray-400">Simulated</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card id="demo-trust-score">
                <div className="h-1 rounded-t-2xl bg-green-500" />
                <CardHeader>
                  <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Reputation Score</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                    <AnimatedNumber value={trustScore} />
                  </p>
                  <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">Good — verified history (simulated)</p>
                </CardContent>
              </Card>
              <Card id="demo-profile">
                <CardHeader>
                  <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Profile</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-grey-medium dark:text-gray-400">Complete your profile to boost visibility (simulated)</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {role === "employer" && (
          <div className="space-y-8">
            <div id="demo-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Active Jobs", value: "12" },
                { label: "Applications", value: "48" },
                { label: "Saved Candidates", value: "24" },
                { label: "Messages", value: "8" },
              ].map((s) => (
                <Card key={s.label} className="p-4">
                  <p className="text-sm text-grey-medium dark:text-gray-400">{s.label}</p>
                  <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">{s.value}</p>
                </Card>
              ))}
            </div>
            <Card id="demo-actions">
              <CardHeader>
                <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Quick Actions</h2>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {["Post job", "Search employees", "Request verification"].map((a) => (
                    <div key={a} className="rounded-xl border border-grey-background dark:border-[#374151] px-4 py-3 text-sm font-medium text-grey-dark dark:text-gray-200">
                      {a}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card id="demo-usage">
              <CardHeader>
                <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Usage (simulated)</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-grey-medium dark:text-gray-400">Reports: <AnimatedNumber value={reportsUsed} /> / 40 — Searches: <AnimatedNumber value={searchesUsed} /> / 50</p>
              </CardContent>
            </Card>
            <Card id="demo-activity">
              <CardHeader>
                <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Recent Activity</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-grey-medium dark:text-gray-400">Simulated activity feed</p>
              </CardContent>
            </Card>
          </div>
        )}

        {role === "advertiser" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card id="demo-impressions">
              <CardHeader>
                <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Impressions</h2>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400"><AnimatedNumber value={impressions} /></p>
              </CardContent>
            </Card>
            <Card id="demo-ctr">
              <CardHeader>
                <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Clicks</h2>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400"><AnimatedNumber value={clicks} /></p>
              </CardContent>
            </Card>
            <Card id="demo-revenue">
              <CardHeader>
                <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Est. Revenue</h2>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$12,500</p>
              </CardContent>
            </Card>
            <Card id="demo-roi">
              <CardHeader>
                <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">ROI</h2>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">2.5x</p>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Spotlight tour overlay */}
      {step === "tour" && currentTour && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <div className="absolute inset-0 pointer-events-auto">
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <mask id="demo-spotlight-mask">
                  <rect width="100%" height="100%" fill="white" />
                  {targetRect && (
                    <rect x={targetRect.x - 8} y={targetRect.y - 8} width={targetRect.width + 16} height={targetRect.height + 16} rx="12" fill="black" />
                  )}
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#demo-spotlight-mask)" />
            </svg>
          </div>
          {targetRect && (
            <div
              className="absolute pointer-events-none rounded-xl border-2 border-blue-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]"
              style={{ left: targetRect.x - 8, top: targetRect.y - 8, width: targetRect.width + 16, height: targetRect.height + 16 }}
            />
          )}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-[10000] pointer-events-auto">
            <div className="bg-white dark:bg-[#1A1F2B] rounded-2xl shadow-xl border border-grey-background dark:border-[#374151] p-6 animate-in fade-in duration-300">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                Step {tourIndex + 1} of {tourSteps.length}
              </p>
              <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-2">{currentTour.title}</h3>
              <p className="text-sm text-grey-medium dark:text-gray-400 mb-6">{currentTour.description}</p>
              <div className="flex items-center justify-between gap-3">
                <Button variant="ghost" size="sm" onClick={() => setStep("dashboard")} className="text-grey-medium dark:text-gray-400">
                  Skip tour
                </Button>
                <div className="flex gap-2">
                  {!isFirstTour && (
                    <Button variant="secondary" size="sm" onClick={() => setTourIndex((i) => i - 1)}>
                      <ArrowLeftIcon className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  )}
                  {isLastTour ? (
                    <Button size="sm" onClick={() => setStep("dashboard")}>
                      Done
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setTourIndex((i) => i + 1)}>
                      Next
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTAs — show after dashboard or when tour is skipped */}
      {(step === "dashboard" || step === "tour") && role && (
        <section className="mx-auto max-w-4xl px-4 py-16 text-center border-t border-grey-background dark:border-[#374151] mt-12">
          <h2 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-4">Ready to get started?</h2>
          <p className="text-grey-medium dark:text-gray-400 mb-8">Create a free account or explore pricing.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" href="/auth/signup" className="rounded-xl px-8">
              Create Free Account
            </Button>
            <Button variant="secondary" size="lg" href="/pricing" className="rounded-xl px-8">
              View Pricing
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
