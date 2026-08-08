"use client";

import { INDUSTRIES } from "@/lib/constants/industries";
import { WvInput } from "@/components/wv";
import type { EmployerSearchFilters } from "@/lib/search/employerSearchTypes";

const selectClass =
  "w-full rounded-xl border border-wv-border bg-wv-surface px-4 py-2.5 text-sm text-wv-foreground transition-colors focus:border-wv-brand-blue/50 focus:outline-none focus:ring-2 focus:ring-wv-brand-blue/30";

type Props = {
  filters: EmployerSearchFilters;
  onChange: (filters: EmployerSearchFilters) => void;
};

export function EmployerSearchFilters({ filters, onChange }: Props) {
  const set = (patch: Partial<EmployerSearchFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <WvInput
        label="Name"
        type="text"
        value={filters.query ?? ""}
        onChange={(e) => set({ query: e.target.value })}
        placeholder="First or full name"
      />
      <WvInput
        label="Company"
        type="text"
        value={filters.company ?? ""}
        onChange={(e) => set({ company: e.target.value })}
        placeholder="Current or previous employer"
      />
      <WvInput
        label="Job title"
        type="text"
        value={filters.jobTitle ?? ""}
        onChange={(e) => set({ jobTitle: e.target.value })}
        placeholder="e.g. Security Guard"
      />
      <div>
        <label htmlFor="search-industry" className="mb-1.5 block text-sm font-medium text-wv-muted">
          Industry
        </label>
        <select
          id="search-industry"
          value={filters.industry ?? ""}
          onChange={(e) => set({ industry: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">All industries</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
      </div>
      <WvInput
        label="Location"
        type="text"
        value={filters.location ?? ""}
        onChange={(e) => set({ location: e.target.value })}
        placeholder="City or state"
      />
      <WvInput
        label="Min trust score"
        type="number"
        value={filters.minTrustScore?.toString() ?? ""}
        onChange={(e) =>
          set({
            minTrustScore: e.target.value === "" ? undefined : Number(e.target.value),
          })
        }
        placeholder="0–100"
        min={0}
        max={100}
      />
    </div>
  );
}
