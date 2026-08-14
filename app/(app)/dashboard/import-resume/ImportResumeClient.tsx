"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { ConfidenceLevel, ExtractedIdentity } from "@/lib/resume/types";
import { confidenceLabel } from "@/lib/resume/confidence";

export type ReviewEmploymentItem = {
  client_id: string;
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  company_normalized?: string;
  confidence: ConfidenceLevel;
  duplicate_of: string | null;
  duplicate_match_reason: string | null;
  duplicate_action: "create" | "skip" | "update";
};

type Step = "upload" | "review" | "success";

const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "txt"];
const MAX_BYTES = 5 * 1024 * 1024;

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const isLow = level === "low";
  const isMedium = level === "medium";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isLow
          ? "text-amber-600 dark:text-amber-400"
          : isMedium
            ? "text-yellow-600 dark:text-yellow-400"
            : "text-green-600 dark:text-green-400"
      }`}
    >
      {isLow ? (
        <ExclamationTriangleIcon className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden />
      )}
      {confidenceLabel(level)}
    </span>
  );
}

function emptyIdentity(): {
  full_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  apply: boolean;
} {
  return {
    full_name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    country: "",
    apply: false,
  };
}

function mapIdentity(raw: ExtractedIdentity) {
  return {
    full_name: raw.full_name?.value ?? "",
    email: raw.email?.value ?? "",
    phone: raw.phone?.value ?? "",
    city: raw.city?.value ?? "",
    state: raw.state?.value ?? "",
    country: raw.country?.value ?? "",
    apply: false,
    confidences: {
      full_name: raw.full_name?.confidence,
      email: raw.email?.confidence,
      phone: raw.phone?.confidence,
      city: raw.city?.confidence,
      state: raw.state?.confidence,
      country: raw.country?.confidence,
    },
  };
}

export function ImportResumeClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploadPath, setUploadPath] = useState<string | null>(null);
  const [employment, setEmployment] = useState<ReviewEmploymentItem[]>([]);
  const [identity, setIdentity] = useState(emptyIdentity());
  const [identityConfidences, setIdentityConfidences] = useState<
    Record<string, ConfidenceLevel | undefined>
  >({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setError("Please choose a PDF, DOC, DOCX, or TXT file.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("File must be 5MB or smaller.");
      return;
    }
    setFile(f);
  }, []);

  const handleUploadAndParse = useCallback(async () => {
    if (!file) {
      setError("Select a file first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("resume", file);
      const uploadRes = await fetch("/api/resume/upload", { method: "POST", body: form });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) {
        setError(uploadData.error ?? "Upload failed.");
        return;
      }
      const path = uploadData.path as string | undefined;
      if (!path) {
        setError("Upload failed: no path returned.");
        return;
      }
      setUploadPath(path);

      const parseRes = await fetch("/api/resume/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const parseData = await parseRes.json().catch(() => ({}));
      if (!parseRes.ok) {
        setError(parseData.error ?? "Could not extract data. You can add employment manually.");
        return;
      }

      const mapped = mapIdentity(parseData.identity ?? {});
      setIdentity({
        full_name: mapped.full_name,
        email: mapped.email,
        phone: mapped.phone,
        city: mapped.city,
        state: mapped.state,
        country: mapped.country,
        apply: Boolean(mapped.full_name || mapped.city || mapped.state),
      });
      setIdentityConfidences(mapped.confidences);

      const list = Array.isArray(parseData.employment) ? parseData.employment : [];
      setEmployment(
        list.map((e: ReviewEmploymentItem) => ({
          ...e,
          duplicate_action: e.duplicate_of ? "skip" : "create",
        }))
      );
      setWarnings(Array.isArray(parseData.warnings) ? parseData.warnings : []);
      setStep("review");
    } finally {
      setLoading(false);
    }
  }, [file]);

  const updateEmployment = useCallback(
    (index: number, field: keyof ReviewEmploymentItem, value: string | boolean | null) => {
      setEmployment((prev) => {
        const next = [...prev];
        if (!next[index]) return next;
        next[index] = { ...next[index], [field]: value };
        if (field === "company_name") {
          next[index].company_normalized = String(value).trim().toLowerCase();
        }
        return next;
      });
    },
    []
  );

  const removeEmployment = useCallback((index: number) => {
    setEmployment((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addEmployment = useCallback(() => {
    setEmployment((prev) => [
      ...prev,
      {
        client_id: `manual-${Date.now()}`,
        company_name: "",
        job_title: "",
        start_date: "",
        end_date: null,
        is_current: false,
        company_normalized: "",
        confidence: "medium" as ConfidenceLevel,
        duplicate_of: null,
        duplicate_match_reason: null,
        duplicate_action: "create",
      },
    ]);
  }, []);

  const handleConfirm = useCallback(async () => {
    const validJobs = employment.filter((e) => e.company_name.trim() && e.start_date.trim());
    if (validJobs.length === 0 && !identity.apply) {
      setError("Add at least one employment entry with company and start date.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload = {
        employment: validJobs.map((e) => ({
          client_id: e.client_id,
          company_name: e.company_name.trim(),
          job_title: e.job_title.trim() || "Unknown",
          start_date: e.start_date,
          end_date: e.end_date,
          is_current: e.is_current,
          company_normalized:
            (e.company_normalized ?? e.company_name.trim().toLowerCase()) ||
            e.company_name.trim().toLowerCase(),
          duplicate_action: e.duplicate_action,
          existing_record_id: e.duplicate_of,
        })),
        identity: identity.apply
          ? {
              apply: true,
              full_name: identity.full_name.trim() || null,
              phone: identity.phone.trim() || null,
              city: identity.city.trim() || null,
              state: identity.state.trim() || null,
              country: identity.country.trim() || null,
            }
          : { apply: false },
        resume_path: uploadPath,
      };

      const res = await fetch("/api/resume/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        return;
      }
      setSavedCount(data.record_ids?.length ?? 0);
      setStep("success");
    } finally {
      setLoading(false);
    }
  }, [employment, identity, uploadPath]);

  if (step === "success") {
    return (
      <Card>
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircleIcon className="h-12 w-12 text-green-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Employment history saved
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            {savedCount > 0
              ? `${savedCount} pending employment record${savedCount === 1 ? "" : "s"} added from your resume. These are claims — verify them to build trust.`
              : "Your profile was updated. Add employment manually if needed."}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="primary" onClick={() => router.push("/dashboard?openVerification=1")}>
              Start verification
            </Button>
            <Button variant="secondary" onClick={() => router.push("/dashboard")}>
              Back to dashboard
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (step === "upload") {
    return (
      <Card>
        <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          Upload resume
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          PDF, DOC, DOCX, or TXT — max 5MB. We extract identity and employment for you to review
          before anything is saved. Resume data is a claim, not verified employment.
        </p>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300"
        />
        {file && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <div className="mt-4">
          <Button variant="primary" onClick={handleUploadAndParse} disabled={!file || loading}>
            {loading ? "Uploading & parsing…" : "Upload and parse"}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
        Review what we found
      </h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        These details were extracted from your resume. Confirm or edit before saving. Nothing is
        verified until you complete the verification flow.
      </p>

      {warnings.length > 0 && (
        <ul className="mb-4 space-y-1 text-sm text-amber-700 dark:text-amber-300" role="status">
          {warnings.map((w) => (
            <li key={w} className="flex items-start gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
              {w}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <section className="mb-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
          Personal information
        </h3>
        <label className="flex items-center gap-2 mb-4 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={identity.apply}
            onChange={(e) => setIdentity((i) => ({ ...i, apply: e.target.checked }))}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          Update my profile with confirmed fields (never overwrites without your approval)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              ["full_name", "Full name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["city", "City"],
              ["state", "State / Province"],
              ["country", "Country"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center justify-between gap-2">
                {label}
                {identityConfidences[key] && (
                  <ConfidenceBadge level={identityConfidences[key]!} />
                )}
              </span>
              <input
                type="text"
                value={identity[key]}
                onChange={(e) => setIdentity((i) => ({ ...i, [key]: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              />
            </label>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Employment history
          </h3>
          <Button type="button" variant="secondary" onClick={addEmployment}>
            Add job
          </Button>
        </div>

        <div className="space-y-4">
          {employment.map((item, index) => (
            <div
              key={item.client_id}
              className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50/50 dark:bg-gray-800/30"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <ConfidenceBadge level={item.confidence} />
                  {item.duplicate_of && (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      {item.duplicate_match_reason ?? "Looks like a record you already have."}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeEmployment(index)}
                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  aria-label="Remove entry"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>

              {item.duplicate_of && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {(["skip", "update", "create"] as const).map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => updateEmployment(index, "duplicate_action", action)}
                      className={`px-2 py-1 rounded border ${
                        item.duplicate_action === action
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {action === "skip"
                        ? "Keep existing"
                        : action === "update"
                          ? "Update existing"
                          : "Create separate"}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-sm text-gray-600 dark:text-gray-400">
                  Company
                  <input
                    type="text"
                    value={item.company_name}
                    onChange={(e) => updateEmployment(index, "company_name", e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                  />
                </label>
                <label className="block text-sm text-gray-600 dark:text-gray-400">
                  Job title
                  <input
                    type="text"
                    value={item.job_title}
                    onChange={(e) => updateEmployment(index, "job_title", e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                  />
                </label>
                <label className="block text-sm text-gray-600 dark:text-gray-400">
                  Start date (YYYY-MM-DD)
                  <input
                    type="text"
                    value={item.start_date}
                    onChange={(e) => updateEmployment(index, "start_date", e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                  />
                </label>
                <label className="block text-sm text-gray-600 dark:text-gray-400">
                  End date (blank if current)
                  <input
                    type="text"
                    value={item.end_date ?? ""}
                    onChange={(e) =>
                      updateEmployment(index, "end_date", e.target.value.trim() || null)
                    }
                    placeholder="YYYY-MM-DD"
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={item.is_current}
                  onChange={(e) => updateEmployment(index, "is_current", e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                Current job
              </label>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? "Saving…" : "Confirm employment history"}
        </Button>
        <Button variant="secondary" onClick={() => setStep("upload")} disabled={loading}>
          Upload different file
        </Button>
      </div>
    </Card>
  );
}
