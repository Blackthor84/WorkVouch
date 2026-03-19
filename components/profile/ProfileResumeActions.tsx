"use client";

import { useState } from "react";
import Link from "next/link";
import { DocumentArrowDownIcon, DocumentTextIcon, ArrowPathIcon, DocumentPlusIcon } from "@heroicons/react/24/outline";

type Props = {
  hasResume: boolean;
};

export function ProfileResumeActions({ hasResume }: Props) {
  const [loading, setLoading] = useState<"view" | "download" | null>(null);

  const fetchSignedUrl = async () => {
    const res = await fetch("/api/resume/me");
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.url) throw new Error("Failed to get resume link");
    return data.url as string;
  };

  const handleView = async () => {
    setLoading("view");
    try {
      const url = await fetchSignedUrl();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // silent or toast
    } finally {
      setLoading(null);
    }
  };

  const handleDownload = async () => {
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
    } catch {
      // silent or toast
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

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Resume
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Your uploaded resume is stored securely and can be shared with employers when they request access.
      </p>
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
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <ArrowPathIcon className="h-4 w-4" />
          👉 Replace Resume
        </Link>
      </div>
    </div>
  );
}
