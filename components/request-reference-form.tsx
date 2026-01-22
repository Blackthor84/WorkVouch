"use client";

import { useState, useEffect } from "react";
import { createReference } from "@/lib/actions/references";
import { getJobsForUser } from "@/lib/actions/jobs";
import { RelationshipType } from "@/types/database";
import { useRouter } from "next/navigation";

interface Connection {
  id: string;
  connected_user: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

interface Job {
  id: string;
  company_name: string;
  job_title: string;
  user_id: string;
}

export function RequestReferenceForm({
  connections,
}: {
  connections: Connection[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedUserJobs, setSelectedUserJobs] = useState<Job[]>([]);
  const [formData, setFormData] = useState({
    to_user_id: "",
    job_id: "",
    relationship_type: "coworker" as RelationshipType,
    rating: 5,
    written_feedback: "",
  });

  // Fetch jobs when user is selected
  useEffect(() => {
    if (formData.to_user_id) {
      setLoadingJobs(true);
      getJobsForUser(formData.to_user_id)
        .then((jobs) => {
          setSelectedUserJobs(jobs || []);
          setFormData((prev) => ({ ...prev, job_id: "" })); // Reset job selection
        })
        .catch((error) => {
          alert(error.message);
          setSelectedUserJobs([]);
        })
        .finally(() => {
          setLoadingJobs(false);
        });
    } else {
      setSelectedUserJobs([]);
    }
  }, [formData.to_user_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createReference(formData);
      alert("Reference created successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1A1F2B] p-6 shadow-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-grey-dark dark:text-gray-200">
            Select Connection *
          </label>
          <select
            required
            value={formData.to_user_id}
            onChange={(e) =>
              setFormData({
                ...formData,
                to_user_id: e.target.value,
                job_id: "",
              })
            }
            className="mt-1 block w-full rounded-xl border border-grey-light dark:border-[#374151] bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 px-3 py-2"
          >
            <option value="">Choose a connection...</option>
            {connections
              .filter((c) => c.connected_user)
              .map((connection) => (
                <option
                  key={connection.id}
                  value={connection.connected_user!.id}
                >
                  {connection.connected_user!.full_name} (
                  {connection.connected_user!.email})
                </option>
              ))}
          </select>
        </div>

        {formData.to_user_id && (
          <div>
            <label className="block text-sm font-medium text-grey-dark dark:text-gray-200">
              Select Job *
            </label>
            {loadingJobs ? (
              <div className="mt-1 text-sm text-grey-medium dark:text-gray-400">
                Loading jobs...
              </div>
            ) : (
              <select
                required
                value={formData.job_id}
                onChange={(e) =>
                  setFormData({ ...formData, job_id: e.target.value })
                }
                className="mt-1 block w-full rounded-xl border border-grey-light dark:border-[#374151] bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 px-3 py-2"
              >
                <option value="">Choose a job...</option>
                {selectedUserJobs.length === 0 ? (
                  <option value="" disabled>
                    No jobs found for this user
                  </option>
                ) : (
                  selectedUserJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.job_title} at {job.company_name}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-grey-dark dark:text-gray-200">
            Relationship Type *
          </label>
          <select
            required
            value={formData.relationship_type}
            onChange={(e) =>
              setFormData({
                ...formData,
                relationship_type: e.target.value as RelationshipType,
              })
            }
            className="mt-1 block w-full rounded-xl border border-grey-light dark:border-[#374151] bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 px-3 py-2"
          >
            <option value="coworker">Coworker</option>
            <option value="supervisor">Supervisor</option>
            <option value="subordinate">Subordinate</option>
            <option value="peer">Peer</option>
            <option value="client">Client</option>
            <option value="vendor">Vendor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-grey-dark dark:text-gray-200">
            Rating * (1-5)
          </label>
          <input
            type="number"
            min="1"
            max="5"
            required
            value={formData.rating}
            onChange={(e) =>
              setFormData({
                ...formData,
                rating: parseInt(e.target.value),
              })
            }
            className="mt-1 block w-full rounded-xl border border-grey-light dark:border-[#374151] bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-grey-dark dark:text-gray-200">
            Written Feedback
          </label>
          <textarea
            rows={6}
            value={formData.written_feedback}
            onChange={(e) =>
              setFormData({ ...formData, written_feedback: e.target.value })
            }
            className="mt-1 block w-full rounded-xl border border-grey-light dark:border-[#374151] bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 px-3 py-2"
            placeholder="Share your experience working with this person..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 px-5 py-2.5 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Reference"}
        </button>
      </form>
    </div>
  );
}
