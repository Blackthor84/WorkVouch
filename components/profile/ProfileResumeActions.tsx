"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Download, RefreshCw, FilePlus } from "lucide-react";
import { WvCard, WvButton } from "@/components/wv";

type Props = {
  hasResume: boolean;
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
      <WvCard>
        <h2 className="text-lg font-semibold text-wv-foreground mb-3">Resume</h2>
        <p className="text-sm text-wv-muted mb-4">
          Upload a resume so employers can request access when viewing your profile.
        </p>
        <WvButton href="/upload-resume" size="sm">
          <FilePlus className="h-4 w-4" aria-hidden />
          Upload Resume
        </WvButton>
      </WvCard>
    );
  }

  const uploadedLabel = formatUploadedAt(resumeUploadedAt);

  return (
    <WvCard>
      <h2 className="text-lg font-semibold text-wv-foreground mb-3">Resume</h2>
      <p className="text-sm text-wv-muted mb-4">
        Your uploaded resume is stored securely and can be shared with employers when they request access.
        {uploadedLabel ? (
          <>
            {" "}
            <span className="text-wv-foreground">Last updated {uploadedLabel}.</span>
          </>
        ) : null}{" "}
        Use View or Download to open a time-limited secure link to your file.
      </p>
      {actionError ? (
        <div
          className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
          role="alert"
        >
          {actionError}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <WvButton type="button" size="sm" onClick={handleView} disabled={loading !== null}>
          <FileText className="h-4 w-4" aria-hidden />
          {loading === "view" ? "Opening…" : "View Resume"}
        </WvButton>
        <WvButton type="button" variant="secondary" size="sm" onClick={handleDownload} disabled={loading !== null}>
          <Download className="h-4 w-4" aria-hidden />
          {loading === "download" ? "Preparing…" : "Download Resume"}
        </WvButton>
        <WvButton href="/upload-resume" variant="outline" size="sm" onClick={() => setActionError(null)}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Replace Resume
        </WvButton>
      </div>
    </WvCard>
  );
}
