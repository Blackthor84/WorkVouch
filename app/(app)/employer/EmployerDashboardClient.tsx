"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  searchCandidatesForEmployer,
  type EmployerCandidateRow,
} from "@/lib/actions/employer/employerCandidateSearch";
import { getSavedCandidates } from "@/lib/actions/employer/saved-candidates";
import { getRecentProfileViews, type RecentView } from "@/lib/actions/employer/employerDashboardStats";
import { CandidateCard } from "@/components/employer/CandidateCard";
import { MagnifyingGlassIcon, UserGroupIcon, BookmarkIcon, ClockIcon } from "@heroicons/react/24/outline";
import type { EmployerDashboardStats } from "@/lib/actions/employer/employerDashboardStats";
import { cn } from "@/lib/utils";

type SavedRow = {
  id: string;
  candidate_id: string;
  saved_at: string;
  profiles?: { id: string; full_name: string | null; industry?: string | null; profile_photo_url?: string | null; trust_scores?: { score: number }[] } | null;
};

export function EmployerDashboardClient({
  initialStats,
}: {
  initialStats: EmployerDashboardStats;
}) {
  const [stats, setStats] = useState(initialStats);
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [minTrust, setMinTrust] = useState<number | "">("");
  const [candidates, setCandidates] = useState<EmployerCandidateRow[]>([]);
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [recent, setRecent] = useState<RecentView[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);

  useEffect(() => {
    setLoadingSearch(true);
    searchCandidatesForEmployer({
      search: search || undefined,
      company: company || undefined,
      jobTitle: jobTitle || undefined,
      location: location || undefined,
      minTrust: minTrust === "" ? undefined : Number(minTrust),
    })
      .then(setCandidates)
      .finally(() => setLoadingSearch(false));
  }, [search, company, jobTitle, location, minTrust]);

  useEffect(() => {
    setLoadingSaved(true);
    getSavedCandidates()
      .then((data) => setSaved((data ?? []) as SavedRow[]))
      .catch(() => setSaved([]))
      .finally(() => setLoadingSaved(false));
  }, []);

  useEffect(() => {
    getRecentProfileViews(5).then(setRecent);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
        Employer Dashboard
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Trust-based hiring. Real references, not resumes.
      </p>

      {/* Top stats */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-sm font-medium text-slate-500">Candidates viewed today</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{stats.candidatesViewedToday}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-sm font-medium text-slate-500">Avg. trust score viewed</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {stats.avgTrustScoreViewed > 0 ? (stats.avgTrustScoreViewed / 20).toFixed(1) : "—"}
          </p>
          <p className="text-xs text-slate-400">out of 5</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-sm font-medium text-slate-500">Saved candidates</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{stats.savedCandidatesCount}</p>
        </div>
      </div>

      {/* Section 1: Search Candidates */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <MagnifyingGlassIcon className="h-5 w-5" />
          Search Candidates
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 min-w-[140px]"
          />
          <input
            type="text"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 min-w-[140px]"
          />
          <input
            type="text"
            placeholder="Job title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 min-w-[140px]"
          />
          <input
            type="text"
            placeholder="Location (state)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 min-w-[120px]"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">Min trust</label>
            <input
              type="number"
              min={0}
              max={100}
              value={minTrust}
              onChange={(e) => setMinTrust(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>
        {loadingSearch ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
            <p className="text-slate-600">No candidates match your filters.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                isSaved={saved.some((s) => s.candidate_id === c.id)}
                onSavedChange={() => {
                  getSavedCandidates()
                    .then((data) => {
                      setSaved((data ?? []) as SavedRow[]);
                      setStats((s) => ({ ...s, savedCandidatesCount: (data ?? []).length }));
                    })
                    .catch(() => {});
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Saved Candidates */}
      <section id="saved" className="mt-10 scroll-mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <BookmarkIcon className="h-5 w-5" />
          Saved Candidates
        </h2>
        {loadingSaved ? (
          <div className="mt-4 h-24 animate-pulse rounded-2xl bg-slate-100" />
        ) : saved.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-8 text-center">
            <p className="text-slate-500">No saved candidates yet. Save candidates from search to see them here.</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {saved.map((row) => {
              const profile = row.profiles ?? (row as any).profiles;
              const name = (profile?.full_name ?? "Candidate") as string;
              const score = Array.isArray(profile?.trust_scores) && profile.trust_scores[0]
                ? (profile.trust_scores[0] as { score: number }).score
                : null;
              return (
                <li
                  key={row.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div>
                    <p className="font-medium text-slate-900">{name}</p>
                    {score != null && (
                      <p className="text-sm text-slate-500">Trust score: {(Number(score) / 20).toFixed(1)} / 5</p>
                    )}
                  </div>
                  <Link
                    href={`/candidate/${row.candidate_id}`}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    View Profile
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Section 3: Recent Activity */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <ClockIcon className="h-5 w-5" />
          Recent Activity
        </h2>
        {recent.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-8 text-center">
            <p className="text-slate-500">No recent profile views.</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {recent.map((v) => (
              <li key={`${v.candidate_id}-${v.viewed_at}`} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3">
                <span className="text-slate-700">{v.candidate_name ?? "Candidate"}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {new Date(v.viewed_at).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/candidate/${v.candidate_id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
