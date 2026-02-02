"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  demoProfiles,
  demoIndustryLabels,
  DEMO_INDUSTRIES,
  type DemoIndustry,
  type DemoProfile,
} from "@/lib/demoData";
import { getIndustryEmphasis } from "@/lib/industryEmphasis";
import type { EmphasisComponent } from "@/lib/industryEmphasis";
import {
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";
import {
  UserCircleIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

function getScoreColor(score: number) {
  if (score < 40) return "text-red-500";
  if (score < 60) return "text-amber-500";
  if (score < 80) return "text-blue-500";
  return "text-green-500";
}

// Demo-only sidebar: same look as employer, no auth or navigation away
function DemoSidebar() {
  const navItems = [
    { label: "Dashboard", icon: HomeIcon },
    { label: "Directory", icon: UserGroupIcon },
    { label: "Candidates", icon: MagnifyingGlassIcon, active: true },
    { label: "Messages", icon: ChatBubbleLeftRightIcon },
    { label: "Billing", icon: CreditCardIcon },
    { label: "Settings", icon: Cog6ToothIcon },
  ];
  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-[#111827] border-r border-grey-background dark:border-[#374151] min-h-screen p-4">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-grey-dark dark:text-gray-200">
          Employer Panel
        </h2>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;
          return (
            <div
              key={item.label}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-grey-dark dark:text-gray-200 hover:bg-grey-background dark:hover:bg-[#1A1F2B]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function DemoHeader() {
  return (
    <header className="bg-white dark:bg-[#111827] border-b border-grey-background dark:border-[#374151] px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-grey-dark dark:text-gray-200">
            Demo Account
          </h1>
          <span className="rounded-md bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
            Preview
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="cursor-default opacity-70">
            Notifications
          </Button>
        </div>
      </div>
    </header>
  );
}

// Detail panel sections in industry-emphasis order
const SECTION_LABELS: Record<
  EmphasisComponent,
  { label: string; getValue: (p: DemoProfile) => string }
> = {
  employment: {
    label: "Verified employment",
    getValue: (p) =>
      `${p.verifiedEmployments} role${p.verifiedEmployments !== 1 ? "s" : ""}`,
  },
  tenure: {
    label: "Tenure strength",
    getValue: (p) =>
      `${p.totalYears} year${p.totalYears !== 1 ? "s" : ""} verified`,
  },
  rating: {
    label: "Peer validation",
    getValue: (p) => `${p.avgRating.toFixed(1)}/5 avg rating`,
  },
  distribution: {
    label: "Reference distribution",
    getValue: (p) =>
      `${p.uniqueEmployers} employer${p.uniqueEmployers !== 1 ? "s" : ""} with references`,
  },
  referenceVolume: {
    label: "Reference count",
    getValue: (p) => `${p.referenceCount} reference${p.referenceCount !== 1 ? "s" : ""}`,
  },
};

function DemoDetailPanel({
  profile,
  industry,
  onClose,
}: {
  profile: DemoProfile;
  industry: DemoIndustry;
  onClose: () => void;
}) {
  const order = getIndustryEmphasis(industry);
  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#111827] border-l border-grey-background dark:border-[#374151]">
      <div className="p-4 border-b border-grey-background dark:border-[#374151] flex items-center justify-between">
        <h3 className="text-lg font-bold text-grey-dark dark:text-gray-200">
          Candidate details
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-grey-background dark:hover:bg-[#1A1F2B] text-grey-medium dark:text-gray-400"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <UserCircleIcon className="h-9 w-9 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-grey-dark dark:text-gray-200">
              {profile.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-2xl font-bold ${getScoreColor(profile.trustScore)}`}
              >
                {profile.trustScore}
              </span>
              <span className="text-xs font-medium text-grey-medium dark:text-gray-400 uppercase tracking-wide">
                Trust Score
              </span>
              <span className="rounded bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                Preview
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {order.map((key) => {
            const { label, getValue } = SECTION_LABELS[key];
            return (
              <div
                key={key}
                className="flex justify-between items-center py-2 border-b border-grey-background dark:border-[#374151]"
              >
                <span className="text-sm text-grey-medium dark:text-gray-400">
                  {label}
                </span>
                <span className="text-sm font-semibold text-grey-dark dark:text-gray-200">
                  {getValue(profile)}
                </span>
              </div>
            );
          })}
          <div className="flex justify-between items-center py-2 border-b border-grey-background dark:border-[#374151]">
            <span className="text-sm text-grey-medium dark:text-gray-400">
              Rehire eligibility
            </span>
            <span className="text-sm font-semibold text-grey-dark dark:text-gray-200">
              {profile.rehireEligible ? "Eligible" : "—"}
            </span>
          </div>
          {profile.fraudFlags > 0 && (
            <div className="flex items-center gap-2 py-2 text-amber-700 dark:text-amber-300">
              <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                Fraud indicators: {profile.fraudFlags} flag
                {profile.fraudFlags !== 1 ? "s" : ""} on file
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DemoProfileCard({
  profile,
  isSelected,
  onClick,
}: {
  profile: DemoProfile;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`overflow-hidden transition-all cursor-pointer hover:shadow-lg ${
        isSelected
          ? "ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg"
          : "hover:border-blue-300 dark:hover:border-blue-600/50"
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <UserCircleIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-grey-dark dark:text-gray-200 truncate">
                {profile.name}
              </h3>
              {profile.rehireEligible && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 mt-0.5">
                  <CheckBadgeIcon className="h-4 w-4" />
                  Rehire eligible
                </span>
              )}
              {profile.fraudFlags > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 mt-0.5 ml-1">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  {profile.fraudFlags} flag
                  {profile.fraudFlags !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="rounded bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                Preview
              </span>
            </div>
            <div className="text-xs font-medium text-grey-medium dark:text-gray-400 uppercase tracking-wide mt-0.5">
              Trust Score
            </div>
            <div
              className={`text-3xl font-bold ${getScoreColor(profile.trustScore)}`}
            >
              {profile.trustScore}
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-grey-background dark:border-[#374151] text-sm text-grey-medium dark:text-gray-400">
          {profile.verifiedEmployments} role
          {profile.verifiedEmployments !== 1 ? "s" : ""} · {profile.totalYears}{" "}
          yr · {profile.avgRating.toFixed(1)}/5 · {profile.referenceCount} ref
          {profile.referenceCount !== 1 ? "s" : ""}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DemoPage() {
  const [industry, setIndustry] = useState<DemoIndustry>("security");
  const [selectedProfile, setSelectedProfile] = useState<DemoProfile | null>(
    null
  );

  const profiles = demoProfiles[industry];

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0D1117]">
      <DemoSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Thin muted demo banner */}
        <div className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/20 dark:border-amber-500/30">
          <p className="text-center py-2 px-4 text-sm font-medium text-amber-800 dark:text-amber-200">
            Demo Mode — Sample Data Only
          </p>
        </div>
        <DemoHeader />
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-8 md:py-12 lg:py-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
                Candidate Search
              </h1>
              <p className="text-grey-medium dark:text-gray-400 mb-6">
                Sample profiles by industry. Click a candidate to view details.
              </p>
              <div className="mb-6">
                <p className="text-sm font-semibold text-grey-dark dark:text-gray-200 mb-3">
                  Industry
                </p>
                <div className="flex flex-wrap gap-2">
                  {DEMO_INDUSTRIES.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setIndustry(key);
                        setSelectedProfile(null);
                      }}
                      className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                        industry === key
                          ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-white shadow-md"
                          : "bg-white dark:bg-[#1A1F2B] text-grey-dark dark:text-gray-200 border border-grey-background dark:border-[#374151] hover:border-blue-500/50 dark:hover:border-blue-500/50"
                      }`}
                    >
                      {demoIndustryLabels[key]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {profiles.map((profile, idx) => (
                  <DemoProfileCard
                    key={`${industry}-${idx}-${profile.name}`}
                    profile={profile}
                    isSelected={
                      selectedProfile !== null &&
                      selectedProfile.name === profile.name
                    }
                    onClick={() => setSelectedProfile(profile)}
                  />
                ))}
              </div>
              {/* CTA section — dashboard-style callout */}
              <section className="rounded-2xl border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] p-8 text-center">
                <h2 className="text-xl font-bold text-grey-dark dark:text-gray-200 mb-2">
                  Ready to access verified employment transparency?
                </h2>
                <p className="text-grey-medium dark:text-gray-400 mb-6 max-w-lg mx-auto">
                  Join employers who use WorkVouch to verify candidate history
                  with confidence.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button href="/signup" variant="primary" size="lg">
                    Start Your Organization
                  </Button>
                  <Button href="/pricing" variant="secondary" size="lg">
                    View Pricing
                  </Button>
                </div>
              </section>
            </div>
          </div>
          {/* Detail panel — visible when a profile is selected */}
          {selectedProfile ? (
            <div className="w-full lg:w-[400px] xl:w-[440px] flex-shrink-0 h-[420px] lg:h-auto lg:min-h-0 border-t lg:border-t-0 lg:border-l border-grey-background dark:border-[#374151]">
              <DemoDetailPanel
                profile={selectedProfile}
                industry={industry}
                onClose={() => setSelectedProfile(null)}
              />
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
