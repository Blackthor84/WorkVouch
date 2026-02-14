"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentArrowUpIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

type ResumeRow = {
  id: string;
  file_path: string;
  status: string;
  parsed_data?: { employment?: unknown[] } | null;
  parsing_error?: string | null;
  created_at: string;
};

export function MyResumesCard() {
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((data) => {
        setResumes(Array.isArray(data.resumes) ? data.resumes : []);
      })
      .catch(() => setResumes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#0F172A]">My Resumes</h3>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href="/dashboard/import-resume">
              <DocumentTextIcon className="h-4 w-4 mr-1" />
              Import
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/upload-resume">
              <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
              Upload
            </Link>
          </Button>
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-[#64748B]">Loading...</p>
      ) : resumes.length === 0 ? (
        <p className="text-sm text-[#64748B] py-2">
          No resumes yet. Upload or import a resume to build your profile.
        </p>
      ) : (
        <ul className="space-y-2">
          {resumes.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0"
            >
              <span className="truncate flex-1">
                {r.file_path.split("/").pop() ?? "Resume"}
              </span>
              <span
                className={
                  r.status === "parsed"
                    ? "text-green-600"
                    : r.status === "failed"
                      ? "text-amber-600"
                      : "text-slate-500"
                }
              >
                {r.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
