"use client";

import { useState } from "react";
import Link from "next/link";
import { DocumentArrowDownIcon, DocumentTextIcon, ArrowPathIcon, DocumentPlusIcon } from "@heroicons/react/24/outline";

type Props = {
  hasResume: boolean;
  /** ISO timestamp from profiles.resume_uploaded_at */
  resumeUploadedAt?: string | null;
};

function formatUploadedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ProfileResumeActions({ hasResume, resumeUploadedAt }: Props) {
  const [loading, setLoading] = useState<"view" | "download" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchSignedUrl = async () => {
    const res = await fetch("/api/resume/me");
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.url) {
      const msg =
        typeof data?.error === "string" && data.error
          ? data.error
          : "Could not open your resume. Try again in a moment.";
      throw new Error(msg);
    }
    return data.url as string;
  };

  const handleView = async () => {
    setActionError(null);
    setLoading("view");
    try {
      const url = await fetchSignedUrl();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  };

  const handleDownload = async () => {
    setActionError(null);
    setLoading("download");
    try {
      const url = await fetchSignedUrl();
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.pdf";
      a.rel = "noopener noreferrer";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  };

  if (!hasResume) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Resume</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Upload a resume so employers can request access when viewing your profile.
        </p>
        <Link
          href="/upload-resume"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <DocumentPlusIcon className="h-4 w-4" />
          Upload Resume
        </Link>
      </div>
    );
  }

  const uploadedLabel = formatUploadedAt(resumeUploadedAt);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Resume
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Your uploaded resume is stored securely and can be shared with employers when they request access.
        {uploadedLabel ? (
          <>
            {" "}
            <span className="text-gray-600 dark:text-gray-300">Last updated {uploadedLabel}.</span>
          </>
        ) : null}{" "}
        Use View or Download to open a time-limited secure link to your file.
      </p>
      {actionError ? (
        <div
          className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-300"
          role="alert"
        >
          {actionError}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleView}
          disabled={loading !== null}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <DocumentTextIcon className="h-4 w-4" />
          {loading === "view" ? "Opening…" : "👉 View Resume"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={loading !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          <DocumentArrowDownIcon className="h-4 w-4" />
          {loading === "download" ? "Preparing…" : "👉 Download Resume"}
        </button>
        <Link
          href="/upload-resume"
          onClick={() => setActionError(null)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <ArrowPathIcon className="h-4 w-4" />
          👉 Replace Resume
        </Link>
      </div>
    </div>
  );
}
