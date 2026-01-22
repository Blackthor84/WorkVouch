"use client";

import { useState } from "react";
import { initiateConnection } from "@/lib/actions/connections";
import { useRouter } from "next/navigation";

interface PotentialCoworker {
  job_id: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    city: string | null;
    state: string | null;
    profile_photo_url: string | null;
  } | null;
  matching_job: {
    company_name: string;
    job_title: string;
    start_date: string;
    end_date: string | null;
  };
}

export function CoworkerList({
  potentialCoworkers,
  jobId,
}: {
  potentialCoworkers: PotentialCoworker[];
  jobId: string;
}) {
  const router = useRouter();
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (userId: string) => {
    setConnecting(userId);
    try {
      await initiateConnection(userId, jobId);
      alert("Connection request sent!");
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setConnecting(null);
    }
  };

  if (potentialCoworkers.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#1A1F2B] p-6 shadow-md">
        <p className="text-grey-500">
          No potential coworkers found for this job.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {potentialCoworkers.map((item) => {
        if (!item.user) return null;

        return (
          <div
            key={item.user.id}
            className="rounded-2xl bg-white dark:bg-[#1A1F2B] p-6 shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-grey-900">
                  {item.user.full_name}
                </h3>
                <p className="text-sm text-grey-600">{item.user.email}</p>
                {item.user.city || item.user.state ? (
                  <p className="text-sm text-grey-600">
                    {[item.user.city, item.user.state]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                ) : null}
                <div className="mt-2 rounded-md bg-grey-background dark:bg-[#111827] p-3">
                  <p className="text-sm text-grey-700">
                    <span className="font-medium">Matching Job:</span>{" "}
                    {item.matching_job.job_title} at{" "}
                    {item.matching_job.company_name}
                  </p>
                  <p className="text-xs text-grey-500">
                    {new Date(
                      item.matching_job.start_date,
                    ).toLocaleDateString()}{" "}
                    -{" "}
                    {item.matching_job.end_date
                      ? new Date(
                          item.matching_job.end_date,
                        ).toLocaleDateString()
                      : "Present"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleConnect(item.user!.id)}
                disabled={connecting === item.user.id}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 px-5 py-2.5 text-sm text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {connecting === item.user.id ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
