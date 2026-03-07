"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Job = {
  id: string;
  job_title: string;
  company_name?: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
};

type TrustEvent = {
  id: string;
  event_type: string;
  payload?: { job_id?: string } | null;
};

interface VerifiedWorkTimelineProps {
  profileId: string;
}

export default function VerifiedWorkTimeline({ profileId }: VerifiedWorkTimelineProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [verifications, setVerifications] = useState<TrustEvent[]>([]);

  useEffect(() => {
    async function load() {
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", profileId)
        .order("start_date", { ascending: false });

      const { data: verifyData } = await supabase
        .from("trust_events")
        .select("*")
        .eq("profile_id", profileId);

      setJobs((jobsData as Job[]) || []);
      setVerifications((verifyData as TrustEvent[]) || []);
    }

    load();
  }, [profileId]);

  function jobScore(jobId: string) {
    const manager = verifications.filter(
      (v) => v.event_type === "manager_verified" && v.payload?.job_id === jobId
    ).length;

    const coworker = verifications.filter(
      (v) => v.event_type === "coworker_verified" && v.payload?.job_id === jobId
    ).length;

    return manager * 10 + coworker * 5;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-grey-dark dark:text-gray-200">Verified Work Timeline</h2>

      {jobs.map((job) => {
        const managerCount = verifications.filter(
          (v) =>
            v.event_type === "manager_verified" &&
            v.payload?.job_id === job.id
        ).length;

        const coworkerCount = verifications.filter(
          (v) =>
            v.event_type === "coworker_verified" &&
            v.payload?.job_id === job.id
        ).length;

        const score = jobScore(job.id);

        return (
          <div
            key={job.id}
            className="border border-grey-background dark:border-[#374151] rounded-lg p-4 bg-white dark:bg-[#111827] shadow-sm"
          >
            <div className="font-semibold text-lg text-grey-dark dark:text-gray-200">
              {job.job_title}
            </div>
            {job.company_name && (
              <div className="text-sm text-grey-medium dark:text-gray-400">
                {job.company_name}
              </div>
            )}
            <div className="text-sm text-grey-medium dark:text-gray-400">
              {job.start_date} — {job.end_date || "Present"}
            </div>

            <div className="mt-2 text-sm space-y-1 text-grey-dark dark:text-gray-300">
              {managerCount > 0 && (
                <div>✔ Manager Verified ({managerCount})</div>
              )}

              {coworkerCount > 0 && (
                <div>✔ Coworker Verified ({coworkerCount})</div>
              )}

              {managerCount === 0 && coworkerCount === 0 && (
                <div className="text-gray-400 dark:text-gray-500">No verifications yet</div>
              )}
            </div>

            <div className="mt-3 text-sm font-semibold text-green-600 dark:text-green-400">
              Trust Impact: +{score}
            </div>
          </div>
        );
      })}
    </div>
  );
}
