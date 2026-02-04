"use client";

import { useState } from "react";
import Link from "next/link";

const STEPS = [
  { title: "Verification System", description: "WorkVouch verifies work history with employers and coworkers. Every profile is backed by real verification." },
  { title: "Reputation Scoring", description: "Our reputation score reflects verified experience and rehire probability. Employers see a single, reliable metric." },
  { title: "Employer Insights", description: "Employers get dashboards, reports, and fit scores to hire with confidence and reduce risk." },
  { title: "Monetization Model", description: "Subscription plans for employers, optional ads, and verified data create a sustainable business." },
];

interface WalkthroughOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function WalkthroughOverlay({ open, onClose }: WalkthroughOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const isFirst = stepIndex === 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-8">
        <p className="text-xs font-medium text-indigo-600 mb-1">Step {stepIndex + 1} of {STEPS.length}</p>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
        <p className="text-slate-600 mb-8">{step.description}</p>
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={onClose} className="text-sm font-medium text-slate-500 hover:text-slate-700">Skip</button>
          <div className="flex gap-2">
            {!isFirst && (
              <button type="button" onClick={() => setStepIndex((i) => i - 1)} className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50">Back</button>
            )}
            {isLast ? (
              <Link href="/signup" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">Create Your Account</Link>
            ) : (
              <button type="button" onClick={() => setStepIndex((i) => i + 1)} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">Next</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
