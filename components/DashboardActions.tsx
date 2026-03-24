"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusIcon, DocumentArrowUpIcon, UserPlusIcon } from "@heroicons/react/24/outline";

type DashboardActionsProps = {
  onRequestVerification?: () => void;
  /** When true, show employer-oriented actions (Search, View Resumes, Post Job, Invite References). */
  variant?: "employee" | "employer";
};

/**
 * Primary action bar for the dashboard. YC-style: top of main content.
 * Employee: Add Verified Job, Upload Resume, Request Verification.
 * Employer: Search Candidates, View Verified Resumes, Post Job, Invite References.
 */
export default function DashboardActions({
  onRequestVerification,
  variant = "employee",
}: DashboardActionsProps) {
  if (variant === "employer") {
    return (
      <div className="flex flex-wrap items-center gap-4" role="toolbar" aria-label="Dashboard actions">
        <Button asChild className="inline-flex items-center gap-2">
          <Link href="/dashboard/employer/search">Search Candidates</Link>
        </Button>
        <Button asChild variant="secondary" className="inline-flex items-center gap-2">
          <Link href="/employer/listed-employees">View Verified Resumes</Link>
        </Button>
        <Button asChild variant="secondary" className="inline-flex items-center gap-2">
          <Link href="/employer/job-posts">Post Job</Link>
        </Button>
        <Button asChild variant="secondary" className="inline-flex items-center gap-2">
          <Link href="/employer/listed-employees">Invite References</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4" role="toolbar" aria-label="Dashboard actions">
      <Button asChild className="inline-flex items-center gap-2">
        <Link href="/profile">
          <PlusIcon className="h-5 w-5" />
          + Add Verified Job
        </Link>
      </Button>
      <Button asChild variant="secondary" className="inline-flex items-center gap-2">
        <Link href="/upload-resume">
          <DocumentArrowUpIcon className="h-5 w-5" />
          Upload Resume
        </Link>
      </Button>
      <Button
        variant="secondary"
        className="inline-flex items-center gap-2"
        onClick={onRequestVerification}
      >
        <UserPlusIcon className="h-5 w-5" />
        Request Verification
      </Button>
    </div>
  );
}
