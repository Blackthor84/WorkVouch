"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { formatDateShort } from "@/lib/utils/date";
import { useRouter } from "next/navigation";

interface Job {
  id: string;
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  is_visible_to_employer: boolean;
  verification_status: "unverified" | "pending" | "verified" | "disputed";
}

interface JobListProps {
  jobs: Job[];
}

export function JobList({ jobs }: JobListProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleVisibilityToggle = async (
    jobId: string,
    currentValue: boolean,
  ) => {
    setUpdating(jobId);
    try {
      const response = await fetch("/api/user/set-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobHistoryId: jobId,
          isVisibleToEmployer: !currentValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update visibility");
      }

      router.refresh();
    } catch (error) {
      console.error("Error updating visibility:", error);
      alert("Failed to update visibility");
    } finally {
      setUpdating(null);
    }
  };

  const handleRequestVerification = async (jobId: string) => {
    if (
      !confirm(
        "Requesting verification will make this job visible to employers. Continue?",
      )
    ) {
      return;
    }

    setUpdating(jobId);
    try {
      const response = await fetch("/api/user/request-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobHistoryId: jobId }),
      });

      if (!response.ok) {
        throw new Error("Failed to request verification");
      }

      router.refresh();
    } catch (error) {
      console.error("Error requesting verification:", error);
      alert("Failed to request verification");
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircleIcon className="h-4 w-4" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            Pending
          </Badge>
        );
      case "disputed":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircleIcon className="h-4 w-4" />
            Disputed
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unverified</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
                  {job.job_title}
                </h3>
                {getStatusBadge(job.verification_status)}
              </div>
              <p className="text-grey-medium dark:text-gray-400 mb-2">
                {job.company_name}
              </p>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                {formatDateShort(job.start_date)} -{" "}
                {job.end_date ? formatDateShort(job.end_date) : "Present"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-grey-background dark:border-[#374151]">
            <div className="flex items-center gap-3">
              {job.is_visible_to_employer ? (
                <EyeIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <EyeSlashIcon className="h-5 w-5 text-grey-medium dark:text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-grey-dark dark:text-gray-200">
                  Visible to Employer
                </p>
                <p className="text-xs text-grey-medium dark:text-gray-400">
                  {job.is_visible_to_employer
                    ? "Employers can see this job"
                    : "Hidden from employers"}
                </p>
              </div>
              <Switch
                checked={job.is_visible_to_employer}
                onCheckedChange={() =>
                  handleVisibilityToggle(job.id, job.is_visible_to_employer)
                }
                disabled={updating === job.id}
              />
            </div>

            {job.verification_status === "unverified" && (
              <Button
                variant="ghost"
                onClick={() => handleRequestVerification(job.id)}
                disabled={updating === job.id}
              >
                Request Verification
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
