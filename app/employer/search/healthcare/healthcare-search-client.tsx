"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { WvCard, WvButton, WvInput, WvBadge } from "@/components/wv";

type Job = {
  id: number;
  job_title: string;
  company_name: string;
  start_date: string;
  end_date: string | null;
  current: boolean;
  certifications: string[] | null;
};

type HealthcareCandidate = {
  id: string;
  full_name: string;
  email: string;
  healthcare_profile: {
    role: string;
    work_setting: string;
  } | null;
  jobs: Job[];
};

/** Raw row from Supabase (has healthcare_profiles array) */
type HealthcareCandidateRow = Omit<HealthcareCandidate, "healthcare_profile"> & {
  healthcare_profiles?: { role: string; work_setting: string }[] | null;
};

const selectClass =
  "w-full rounded-xl border border-wv-border bg-wv-surface px-4 py-3 text-sm text-wv-foreground focus:border-wv-brand-blue/50 focus:outline-none focus:ring-2 focus:ring-wv-brand-blue/30";

export function HealthcareSearchClient() {
  const supabase = supabaseBrowser;
  const [candidates, setCandidates] = useState<HealthcareCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    role: "",
    workSetting: "",
    certification: "",
    minExperience: "",
  });

  const searchCandidates = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          email,
          healthcare_profiles (
            role,
            work_setting
          ),
          jobs (
            id,
            job_title,
            company_name,
            start_date,
            end_date,
            current,
            certifications
          )
        `,
        )
        .eq("industry", "Healthcare")
        .not("healthcare_profiles", "is", null);

      if (filters.role) {
        query = query.eq("healthcare_profiles.role", filters.role);
      }

      if (filters.workSetting) {
        query = query.eq("healthcare_profiles.work_setting", filters.workSetting);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filtered = data || [];

      if (filters.certification) {
        filtered = filtered.filter((candidate: any) => {
          return candidate.jobs?.some((job: any) => job.certifications?.includes(filters.certification));
        });
      }

      if (filters.minExperience) {
        const minYears = parseInt(filters.minExperience);
        filtered = filtered.filter((candidate: any) => {
          if (!candidate.jobs || candidate.jobs.length === 0) return false;

          const totalMonths = candidate.jobs.reduce((total: number, job: any) => {
            const start = new Date(job.start_date);
            const end = job.end_date ? new Date(job.end_date) : new Date();
            const months = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
            return total + months;
          }, 0);

          return totalMonths >= minYears * 12;
        });
      }

      setCandidates(
        (filtered as HealthcareCandidateRow[]).map((candidate: HealthcareCandidateRow) => ({
          ...candidate,
          healthcare_profile: candidate.healthcare_profiles?.[0] ?? null,
        })),
      );
    } catch (error) {
      console.error("Error searching candidates:", error);
      alert("Error searching candidates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchCandidates();
  }, []);

  const healthcareRoles = [
    "CNA",
    "HHA",
    "Medical Assistant",
    "Patient Care Tech",
    "Dental Assistant",
    "Medical Receptionist",
    "Phlebotomist",
    "Pharmacy Technician",
    "ER Tech",
    "Caregiver",
    "Lab Assistant",
    "Sterile Processing Tech",
  ];

  const workSettings = [
    "Hospital",
    "Nursing Home",
    "Assisted Living",
    "Home Health Agency",
    "Dental Office",
    "Clinic / Outpatient",
    "Rehab Center",
    "Lab / Diagnostics",
  ];

  return (
    <div className="space-y-6">
      <WvCard>
        <h2 className="text-xl font-bold text-wv-foreground mb-4">Search Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-wv-muted">
              Role
            </label>
            <select
              id="role"
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className={selectClass}
            >
              <option value="">All Roles</option>
              {healthcareRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="workSetting" className="mb-1.5 block text-sm font-medium text-wv-muted">
              Work Setting
            </label>
            <select
              id="workSetting"
              value={filters.workSetting}
              onChange={(e) => setFilters({ ...filters, workSetting: e.target.value })}
              className={selectClass}
            >
              <option value="">All Settings</option>
              {workSettings.map((setting) => (
                <option key={setting} value={setting}>
                  {setting}
                </option>
              ))}
            </select>
          </div>
          <WvInput
            label="Certification"
            id="certification"
            value={filters.certification}
            onChange={(e) => setFilters({ ...filters, certification: e.target.value })}
            placeholder="e.g., BLS, CPR"
          />
          <WvInput
            label="Min Experience (Years)"
            id="minExperience"
            type="number"
            value={filters.minExperience}
            onChange={(e) => setFilters({ ...filters, minExperience: e.target.value })}
            placeholder="e.g., 2"
          />
        </div>
        <WvButton onClick={searchCandidates} className="mt-4" disabled={loading}>
          {loading ? "Searching..." : "Search Candidates"}
        </WvButton>
      </WvCard>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-wv-foreground">Results ({candidates.length})</h2>
        {loading ? (
          <p className="text-wv-muted">Loading...</p>
        ) : candidates.length === 0 ? (
          <WvCard className="p-6 text-center">
            <p className="text-wv-muted">No candidates found. Try adjusting your filters.</p>
          </WvCard>
        ) : (
          candidates.map((candidate) => (
            <WvCard key={candidate.id}>
              <div className="flex items-start justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-wv-foreground">{candidate.full_name}</h3>
                  <p className="text-wv-muted">{candidate.email}</p>
                </div>
                <WvButton href={`/employer/reports/${candidate.id}`} size="sm">
                  View Full Profile
                </WvButton>
              </div>

              {candidate.healthcare_profile && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  <WvBadge variant="brand">{candidate.healthcare_profile.role}</WvBadge>
                  <WvBadge>{candidate.healthcare_profile.work_setting}</WvBadge>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-semibold text-wv-foreground">Work History ({candidate.jobs.length})</h4>
                {candidate.jobs.map((job) => (
                  <div key={job.id} className="border-l-4 border-blue-500/50 pl-4 py-2">
                    <p className="font-semibold text-wv-foreground">
                      {job.job_title} at {job.company_name}
                    </p>
                    <p className="text-sm text-wv-muted">
                      {new Date(job.start_date).toLocaleDateString()} -{" "}
                      {job.end_date ? new Date(job.end_date).toLocaleDateString() : "Present"}
                    </p>
                    {job.certifications && job.certifications.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {job.certifications.map((cert, idx) => (
                          <WvBadge key={idx} variant="brand" className="text-xs">
                            {cert}
                          </WvBadge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </WvCard>
          ))
        )}
      </div>
    </div>
  );
}
