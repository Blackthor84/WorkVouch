"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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

export function HealthcareSearchClient() {
  const [candidates, setCandidates] = useState<HealthcareCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    role: "",
    workSetting: "",
    certification: "",
    minExperience: "",
  });
  // Using single supabase instance

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
        query = query.eq(
          "healthcare_profiles.work_setting",
          filters.workSetting,
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      let filtered = data || [];

      // Filter by certification in JavaScript (since it's an array)
      if (filters.certification) {
        filtered = filtered.filter((candidate: any) => {
          return candidate.jobs?.some((job: any) =>
            job.certifications?.includes(filters.certification),
          );
        });
      }

      // Filter by minimum experience
      if (filters.minExperience) {
        const minYears = parseInt(filters.minExperience);
        filtered = filtered.filter((candidate: any) => {
          if (!candidate.jobs || candidate.jobs.length === 0) return false;

          const totalMonths = candidate.jobs.reduce(
            (total: number, job: any) => {
              const start = new Date(job.start_date);
              const end = job.end_date ? new Date(job.end_date) : new Date();
              const months =
                (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
              return total + months;
            },
            0,
          );

          return totalMonths >= minYears * 12;
        });
      }

      setCandidates(
        (filtered as HealthcareCandidateRow[]).map((candidate: HealthcareCandidateRow) => ({
          ...candidate,
          healthcare_profile: candidate.healthcare_profiles?.[0] ?? null,
        }))
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
      {/* Search Filters */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-grey-dark dark:text-gray-200 mb-4">
          Search Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full border rounded-md p-2 mt-1"
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
            <Label htmlFor="workSetting">Work Setting</Label>
            <select
              id="workSetting"
              value={filters.workSetting}
              onChange={(e) =>
                setFilters({ ...filters, workSetting: e.target.value })
              }
              className="w-full border rounded-md p-2 mt-1"
            >
              <option value="">All Settings</option>
              {workSettings.map((setting) => (
                <option key={setting} value={setting}>
                  {setting}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="certification">Certification</Label>
            <Input
              id="certification"
              value={filters.certification}
              onChange={(e) =>
                setFilters({ ...filters, certification: e.target.value })
              }
              placeholder="e.g., BLS, CPR"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="minExperience">Min Experience (Years)</Label>
            <Input
              id="minExperience"
              type="number"
              value={filters.minExperience}
              onChange={(e) =>
                setFilters({ ...filters, minExperience: e.target.value })
              }
              placeholder="e.g., 2"
              className="mt-1"
            />
          </div>
        </div>
        <Button onClick={searchCandidates} className="mt-4" disabled={loading}>
          {loading ? "Searching..." : "Search Candidates"}
        </Button>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-grey-dark dark:text-gray-200">
          Results ({candidates.length})
        </h2>
        {loading ? (
          <p className="text-grey-medium dark:text-gray-400">Loading...</p>
        ) : candidates.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-grey-medium dark:text-gray-400">
              No candidates found. Try adjusting your filters.
            </p>
          </Card>
        ) : (
          candidates.map((candidate) => (
            <Card key={candidate.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-grey-dark dark:text-gray-200">
                    {candidate.full_name}
                  </h3>
                  <p className="text-grey-medium dark:text-gray-400">
                    {candidate.email}
                  </p>
                </div>
                <Button
                  href={`/employer/reports/${candidate.id}`}
                  variant="primary"
                >
                  View Full Profile
                </Button>
              </div>

              {candidate.healthcare_profile && (
                <div className="flex gap-2 mb-4">
                  <Badge>{candidate.healthcare_profile.role}</Badge>
                  <Badge variant="info">
                    {candidate.healthcare_profile.work_setting}
                  </Badge>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-semibold text-grey-dark dark:text-gray-200">
                  Work History ({candidate.jobs.length})
                </h4>
                {candidate.jobs.map((job) => (
                  <div
                    key={job.id}
                    className="border-l-4 border-blue-600 pl-4 py-2"
                  >
                    <p className="font-semibold text-grey-dark dark:text-gray-200">
                      {job.job_title} at {job.company_name}
                    </p>
                    <p className="text-sm text-grey-medium dark:text-gray-400">
                      {new Date(job.start_date).toLocaleDateString()} -{" "}
                      {job.end_date
                        ? new Date(job.end_date).toLocaleDateString()
                        : "Present"}
                    </p>
                    {job.certifications && job.certifications.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {job.certifications.map((cert, idx) => (
                          <Badge key={idx} variant="info" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
