"use client";

import { useState } from "react";
import { softDeleteReference } from "@/lib/actions/admin";

interface User {
  id: string;
  full_name: string;
  email: string;
  city: string | null;
  state: string | null;
  created_at: string;
  role?: string;
  trust_scores: Array<{
    score: number;
    job_count: number;
    reference_count: number;
  }> | null;
}

interface Job {
  id: string;
  company_name: string;
  job_title: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface Reference {
  id: string;
  rating: number;
  written_feedback: string | null;
  is_deleted: boolean;
  created_at: string;
  from_user: {
    id: string;
    full_name: string;
    email: string;
  };
  to_user: {
    id: string;
    full_name: string;
    email: string;
  };
  job: {
    id: string;
    company_name: string;
    job_title: string;
  } | null;
}

export function AdminPanel({
  users,
  jobs,
  references,
}: {
  users: User[];
  jobs: Job[];
  references: Reference[];
}) {
  const [activeTab, setActiveTab] = useState<"users" | "jobs" | "references">(
    "users",
  );
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDeleteReference = async (refId: string) => {
    if (!confirm("Are you sure you want to soft-delete this reference?"))
      return;

    setDeleting(refId);
    try {
      await softDeleteReference(refId);
      alert("Reference deleted successfully");
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-grey-background dark:border-[#374151]">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("users")}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === "users"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                : "border-transparent text-grey-medium dark:text-gray-400 hover:border-grey-light dark:hover:border-[#374151] hover:text-grey-dark dark:hover:text-gray-300"
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === "jobs"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                : "border-transparent text-grey-medium dark:text-gray-400 hover:border-grey-light dark:hover:border-[#374151] hover:text-grey-dark dark:hover:text-gray-300"
            }`}
          >
            Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab("references")}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === "references"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                : "border-transparent text-grey-medium dark:text-gray-400 hover:border-grey-light dark:hover:border-[#374151] hover:text-grey-dark dark:hover:text-gray-300"
            }`}
          >
            References ({references.length})
          </button>
        </nav>
      </div>

      {activeTab === "users" && (
        <div className="rounded-2xl bg-white dark:bg-[#1A1F2B] shadow-md border border-grey-background dark:border-[#374151]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-grey-background dark:divide-[#374151]">
              <thead className="bg-grey-background dark:bg-[#111827]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-grey-medium dark:text-gray-400">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-grey-medium dark:text-gray-400">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-grey-medium dark:text-gray-400">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-grey-medium dark:text-gray-400">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-grey-medium dark:text-gray-400">
                    Reputation Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-background dark:divide-[#374151] bg-white dark:bg-[#1A1F2B]">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-grey-background dark:hover:bg-[#111827]"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-grey-dark dark:text-gray-200">
                      {user.full_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-grey-medium dark:text-gray-400">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-grey-medium dark:text-gray-400">
                      {[user.city, user.state].filter(Boolean).join(", ") ||
                        "N/A"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-grey-medium dark:text-gray-400">
                      {user.role ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-grey-medium dark:text-gray-400">
                      {user.trust_scores?.[0]?.score.toFixed(1) || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "jobs" && (
        <div className="rounded-2xl bg-white dark:bg-[#1A1F2B] shadow-md border border-grey-background dark:border-[#374151]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-grey-background dark:divide-[#374151]">
              <thead className="bg-grey-background dark:bg-[#111827]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-grey-medium dark:text-gray-400">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-grey-medium dark:text-gray-400">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-grey-medium dark:text-gray-400">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-grey-medium dark:text-gray-400">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-background dark:divide-[#374151] bg-white dark:bg-[#1A1F2B]">
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-grey-background dark:hover:bg-[#111827]"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-grey-dark dark:text-gray-200">
                      {job.profiles.full_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-grey-medium dark:text-gray-400">
                      {job.company_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-grey-medium dark:text-gray-400">
                      {job.job_title}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-grey-medium dark:text-gray-400">
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "references" && (
        <div className="rounded-2xl bg-white dark:bg-[#1A1F2B] shadow-md border border-grey-background dark:border-[#374151]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-grey-background dark:divide-[#374151]">
              <thead className="bg-grey-background dark:bg-[#111827]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-grey-medium dark:text-gray-400">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-grey-medium dark:text-gray-400">
                    To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-grey-medium dark:text-gray-400">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-grey-medium dark:text-gray-400">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-grey-medium dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-grey-medium dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-background dark:divide-[#374151] bg-white dark:bg-[#1A1F2B]">
                {references.map((ref) => (
                  <tr
                    key={ref.id}
                    className="hover:bg-grey-background dark:hover:bg-[#111827]"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-grey-dark dark:text-gray-200">
                      {ref.from_user.full_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-grey-medium dark:text-gray-400">
                      {ref.to_user.full_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-grey-medium dark:text-gray-400">
                      {ref.job?.company_name || "N/A"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-grey-medium dark:text-gray-400">
                      {ref.rating}/5
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-grey-medium dark:text-gray-400">
                      {ref.is_deleted ? (
                        <span className="rounded-xl bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-2 py-1 text-red-800 dark:text-red-300">
                          Deleted
                        </span>
                      ) : (
                        <span className="rounded-xl bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2 py-1 text-green-800 dark:text-green-300">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-grey-medium dark:text-gray-400">
                      {!ref.is_deleted && (
                        <button
                          onClick={() => handleDeleteReference(ref.id)}
                          disabled={deleting === ref.id}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 font-medium"
                        >
                          {deleting === ref.id ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
