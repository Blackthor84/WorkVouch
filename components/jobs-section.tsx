"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob, deleteJob } from "@/lib/actions/jobs";
import { EmploymentType } from "@/types/database";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  MapPinIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

interface Job {
  id: string;
  company_name: string;
  job_title: string;
  employment_type: EmploymentType;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  location: string | null;
  is_private: boolean;
}

export function JobsSection({ jobs }: { jobs: Job[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company_name: "",
    job_title: "",
    employment_type: "full_time" as EmploymentType,
    start_date: "",
    end_date: "",
    is_current: false,
    location: "",
    is_private: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createJob({
        ...formData,
        end_date: formData.is_current ? null : formData.end_date || null,
      });
      setShowForm(false);
      setSuccess(true);
      setFormData({
        company_name: "",
        job_title: "",
        employment_type: "full_time",
        start_date: "",
        end_date: "",
        is_current: false,
        location: "",
        is_private: false,
      });
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      await deleteJob(jobId);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not delete. Please try again.";
      setError(message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BriefcaseIcon className="h-6 w-6 text-primary" />
            Job History
          </CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add Job"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
            <p className="font-semibold">Job added successfully.</p>
            <Button
              variant="primary"
              className="mt-3"
              onClick={() => {
                setSuccess(false);
                router.push("/dashboard");
              }}
            >
              Go to dashboard
            </Button>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 pt-4 border-t border-gray-200"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
                className="w-full rounded-xl border bg-white text-[#334155] border-[#E2E8F0] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={formData.job_title}
                onChange={(e) =>
                  setFormData({ ...formData, job_title: e.target.value })
                }
                className="w-full rounded-xl border bg-white text-[#334155] border-[#E2E8F0] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Employment Type *
                </label>
                <select
                  required
                  value={formData.employment_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employment_type: e.target.value as EmploymentType,
                    })
                  }
                  className="w-full rounded-xl border bg-white text-[#334155] border-[#E2E8F0] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="temporary">Temporary</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full rounded-xl border bg-white text-[#334155] border-[#E2E8F0] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  className="w-full rounded-xl border bg-white text-[#334155] border-[#E2E8F0] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  disabled={formData.is_current}
                  className="w-full rounded-xl border bg-white text-[#334155] border-[#E2E8F0] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_current}
                  onChange={(e) =>
                    setFormData({ ...formData, is_current: e.target.checked })
                  }
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">
                  Current Job
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_private}
                  onChange={(e) =>
                    setFormData({ ...formData, is_private: e.target.checked })
                  }
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">
                  Private
                </span>
              </label>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Adding job…" : "Add Job"}
            </Button>
          </form>
        )}

        <div className="space-y-4 pt-4 border-t border-gray-200">
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <BriefcaseIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-900 font-bold">No jobs added yet.</p>
              <p className="text-sm text-gray-900 mt-2 font-semibold">
                Add your first job to get started.
              </p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <BuildingOfficeIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {job.job_title}
                        </h3>
                        <p className="text-sm text-gray-900 font-semibold">
                          {job.company_name}
                        </p>
                      </div>
                    </div>
                    <div className="ml-13 space-y-2 mt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-900 font-semibold">
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                          {new Date(job.start_date).toLocaleDateString()} -{" "}
                          {job.is_current
                            ? "Present"
                            : job.end_date
                              ? new Date(job.end_date).toLocaleDateString()
                              : "N/A"}
                        </span>
                      </div>
                      {job.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-900 font-semibold">
                          <MapPinIcon className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        {job.is_private && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                            Private
                          </span>
                        )}
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {job.employment_type.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/jobs/${job.id}/coworkers`}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      <UserGroupIcon className="h-4 w-4" />
                      Find Coworkers
                    </Link>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
