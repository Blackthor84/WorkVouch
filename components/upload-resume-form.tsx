"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DocumentArrowUpIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx"];
const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export function UploadResumeForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    if (!selectedFile) {
      setFile(null);
      return;
    }
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setError("Invalid file type. Please upload a PDF, DOC, or DOCX file.");
      setFile(null);
      return;
    }
    if (selectedFile.size > MAX_BYTES) {
      setError(`File size exceeds ${MAX_MB}MB limit.`);
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(false);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      setUploadProgress(30);
      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Upload failed, try again");
      }

      setUploadProgress(100);
      setSuccess(true);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => {
        setSuccess(false);
        setUploadProgress(0);
        router.refresh();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed, try again");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div
          className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="flex items-center gap-2 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-300"
          role="status"
        >
          <CheckCircleIcon className="h-5 w-5 shrink-0" />
          Resume uploaded successfully
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Choose file (PDF, DOC, or DOCX, max {MAX_MB}MB)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          disabled={isUploading}
          className="block w-full text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700 dark:file:bg-blue-500 dark:hover:file:bg-blue-600"
        />
      </div>

      {file && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-4">
          <div className="flex items-center gap-2 min-w-0">
            <DocumentArrowUpIcon className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {file.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="shrink-0"
          >
            {isUploading ? "Uploading…" : "👉 Upload Resume"}
          </Button>
        </div>
      )}

      {isUploading && (
        <div className="w-full rounded-full h-2.5 bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
