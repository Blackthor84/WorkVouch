"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, TrashIcon } from "@heroicons/react/24/outline";

export type EmploymentItem = {
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  company_normalized?: string;
};

type Step = "upload" | "review" | "success";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_BYTES = 5 * 1024 * 1024;

export function ImportResumeClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploadPath, setUploadPath] = useState<string | null>(null);
  const [employment, setEmployment] = useState<EmploymentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Please choose a PDF or DOCX file.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("File must be 5MB or smaller.");
      return;
    }
    setFile(f);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) {
      setError("Select a file first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      if (!data.path) {
        setError("Upload failed: no path returned.");
        return;
      }
      setUploadPath(data.path);
    } finally {
      setLoading(false);
    }
  }, [file]);

  const handleParse = useCallback(async () => {
    if (!uploadPath) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/resume/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: uploadPath }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not extract employment data. Please add manually.");
        return;
      }
      const list = Array.isArray(data.employment) ? data.employment : [];
      setEmployment(list);
      setStep("review");
    } finally {
      setLoading(false);
    }
  }, [uploadPath]);

  const updateEmployment = useCallback((index: number, field: keyof EmploymentItem, value: string | boolean | null) => {
    setEmployment((prev) => {
      const next = [...prev];
      if (!next[index]) return next;
      next[index] = { ...next[index], [field]: value };
      if (field === "company_name") {
        next[index].company_normalized = String(value).trim().toLowerCase();
      }
      return next;
    });
  }, []);

  const removeEmployment = useCallback((index: number) => {
    setEmployment((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (employment.length === 0) {
      setError("Add at least one employment entry.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload = employment.map((e) => ({
        company_name: e.company_name.trim(),
        job_title: e.job_title.trim(),
        start_date: e.start_date,
        end_date: e.end_date,
        is_current: e.is_current,
        company_normalized: (e.company_normalized ?? e.company_name.trim().toLowerCase()) || e.company_name.trim().toLowerCase(),
      }));
      const res = await fetch("/api/resume/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employment: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        return;
      }
      setConfirmSuccess(true);
      setStep("success");
    } finally {
      setLoading(false);
    }
  }, [employment]);

  if (step === "success") {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircleIcon className="h-12 w-12 text-green-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Employment history saved
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your records have been added and coworker matching has been triggered.
          </p>
          <Button
            variant="primary"
            onClick={() => router.push("/dashboard")}
          >
            Back to dashboard
          </Button>
        </div>
      </Card>
    );
  }

  if (step === "upload") {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Step 1: Upload resume
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          PDF or DOCX, max 5MB. We’ll extract employment history for you to review.
        </p>
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
        <div className="mt-4 flex gap-2">
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? "Uploading…" : "Upload"}
          </Button>
          {uploadPath && (
            <Button
              variant="secondary"
              onClick={handleParse}
              disabled={loading}
            >
              {loading ? "Parsing…" : "Parse resume"}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Step 2: Review and edit
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Edit any field, then confirm to save. Records are only added when you click Confirm.
      </p>
      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="space-y-4">
        {employment.map((item, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50/50 dark:bg-gray-800/30"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Entry {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeEmployment(index)}
                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                aria-label="Remove entry"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-sm text-gray-600 dark:text-gray-400">
                Company
                <input
                  type="text"
                  value={item.company_name}
                  onChange={(e) => updateEmployment(index, "company_name", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                />
              </label>
              <label className="block text-sm text-gray-600 dark:text-gray-400">
                Job title
                <input
                  type="text"
                  value={item.job_title}
                  onChange={(e) => updateEmployment(index, "job_title", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                />
              </label>
              <label className="block text-sm text-gray-600 dark:text-gray-400">
                Start date (YYYY-MM-DD)
                <input
                  type="text"
                  value={item.start_date}
                  onChange={(e) => updateEmployment(index, "start_date", e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                />
              </label>
              <label className="block text-sm text-gray-600 dark:text-gray-400">
                End date (YYYY-MM-DD or leave blank if current)
                <input
                  type="text"
                  value={item.end_date ?? ""}
                  onChange={(e) =>
                    updateEmployment(index, "end_date", e.target.value.trim() || null)
                  }
                  placeholder="YYYY-MM-DD or blank"
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
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
      <div className="mt-6 flex gap-2">
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={employment.length === 0 || loading}
        >
          {loading ? "Saving…" : "Confirm and save"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setStep("upload")}
          disabled={loading}
        >
          Back
        </Button>
      </div>
    </Card>
  );
}
