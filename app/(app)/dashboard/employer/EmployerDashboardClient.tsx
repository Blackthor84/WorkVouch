"use client";

import { useState, useEffect } from "react";
import { searchCandidatesForEmployer, type EmployerCandidateRow } from "@/lib/actions/employer/employerCandidateSearch";
import { CandidateCard } from "@/components/employer/CandidateCard";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export function EmployerDashboardClient() {
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("");
  const [minTrust, setMinTrust] = useState<number | "">("");
  const [maxTrust, setMaxTrust] = useState<number | "">("");
  const [candidates, setCandidates] = useState<EmployerCandidateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    searchCandidatesForEmployer({
      search: search || undefined,
      company: company || undefined,
      minTrust: minTrust === "" ? undefined : Number(minTrust),
      maxTrust: maxTrust === "" ? undefined : Number(maxTrust),
    })
      .then(setCandidates)
      .finally(() => setLoading(false));
  }, [search, company, minTrust, maxTrust]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Find Verified Candidates</h1>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
        <input
          type="text"
          placeholder="Company (optional)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            placeholder="Min trust"
            value={minTrust}
            onChange={(e) => setMinTrust(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:border-slate-400 focus:outline-none"
          />
          <span className="text-slate-400">–</span>
          <input
            type="number"
            min={0}
            max={100}
            placeholder="Max trust"
            value={maxTrust}
            onChange={(e) => setMaxTrust(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:border-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <p className="text-slate-600">No candidates match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((c) => (
            <CandidateCard key={c.id} candidate={c} />
          ))}
        </div>
      )}
    </div>
  );
}
