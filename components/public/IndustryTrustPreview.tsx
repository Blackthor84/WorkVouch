"use client";

import { useState, useEffect, useCallback } from "react";
import { TrustProfilePreview, type TrustProfilePreviewData } from "@/components/profile";
import { cn } from "@/lib/utils";

export type IndustryKey =
  | "law_enforcement"
  | "healthcare"
  | "security"
  | "hospitality"
  | "retail"
  | "warehouse_logistics";

const INDUSTRIES: { key: IndustryKey; label: string }[] = [
  { key: "law_enforcement", label: "Law Enforcement" },
  { key: "healthcare", label: "Healthcare" },
  { key: "security", label: "Security" },
  { key: "hospitality", label: "Hospitality" },
  { key: "retail", label: "Retail" },
  { key: "warehouse_logistics", label: "Warehouse & Logistics" },
];

const INDUSTRY_PREVIEWS: Record<IndustryKey, TrustProfilePreviewData> = {
  law_enforcement: {
    fullName: "Marcus Webb",
    position: "Patrol Officer",
    company: "County Sheriff's Office",
    verified: true,
    trustScore: 91,
    referencesCount: 8,
    rehireEligible: true,
    summary: "Verified service record with strong peer confirmations and consistent performance.",
  },
  healthcare: {
    fullName: "Jennifer Park",
    position: "RN",
    company: "Regional Medical Center",
    verified: true,
    trustScore: 89,
    referencesCount: 10,
    rehireEligible: true,
    summary: "Verified nursing credentials and positive peer references from clinical staff.",
  },
  security: {
    fullName: "Sarah Chen",
    position: "Senior Security Officer",
    company: "Sentinel Security Group",
    verified: true,
    trustScore: 87,
    referencesCount: 12,
    rehireEligible: true,
    summary: "Verified professional with strong peer confirmations and positive employment history.",
  },
  hospitality: {
    fullName: "David Torres",
    position: "Front Office Manager",
    company: "Harbor Hotel Group",
    verified: true,
    trustScore: 84,
    referencesCount: 6,
    rehireEligible: true,
    summary: "Verified hospitality experience with strong references from management and peers.",
  },
  retail: {
    fullName: "Amanda Foster",
    position: "Store Manager",
    company: "Metro Retail Co.",
    verified: true,
    trustScore: 82,
    referencesCount: 7,
    rehireEligible: true,
    summary: "Verified retail management experience and reliable attendance record.",
  },
  warehouse_logistics: {
    fullName: "James Okonkwo",
    position: "Shift Lead",
    company: "Premier Logistics",
    verified: true,
    trustScore: 86,
    referencesCount: 9,
    rehireEligible: true,
    summary: "Verified logistics experience with strong safety record and peer confirmations.",
  },
};

const ROTATION_MS = 8000;
const FADE_MS = 250;

export default function IndustryTrustPreview() {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryKey>("security");
  const [displayedIndustry, setDisplayedIndustry] = useState<IndustryKey>("security");
  const [fading, setFading] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  const selectIndustry = useCallback((key: IndustryKey) => {
    setAutoRotate(false);
    if (key === selectedIndustry) return;
    setSelectedIndustry(key);
    setFading(true);
  }, [selectedIndustry]);

  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(() => {
      setDisplayedIndustry(selectedIndustry);
      setFading(false);
    }, FADE_MS);
    return () => clearTimeout(t);
  }, [fading, selectedIndustry]);

  useEffect(() => {
    if (!autoRotate) return;
    const currentIndex = INDUSTRIES.findIndex((i) => i.key === selectedIndustry);
    const nextIndex = (currentIndex + 1) % INDUSTRIES.length;
    const nextKey = INDUSTRIES[nextIndex].key;
    const id = setInterval(() => {
      setSelectedIndustry(nextKey);
      setFading(true);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [autoRotate, selectedIndustry]);

  const preview = INDUSTRY_PREVIEWS[displayedIndustry];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-[#1E293B] dark:text-white sm:text-3xl">
          Trusted Across Critical Industries
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          A standardized trust layer for operational workforces.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {INDUSTRIES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => selectIndustry(key)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200",
              selectedIndustry === key
                ? "border-[#10B981] bg-emerald-50 text-[#1E293B] dark:bg-emerald-900/20 dark:text-slate-100 dark:border-emerald-700"
                : "border-slate-200 bg-[#F8FAFC] text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:bg-slate-800"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className="transition-opacity duration-300 ease-out"
        style={{ opacity: fading ? 0 : 1 }}
      >
        <TrustProfilePreview preview={preview} className="w-full max-w-md" />
      </div>
    </div>
  );
}
