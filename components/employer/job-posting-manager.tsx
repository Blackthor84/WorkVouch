"use client";

import { useState, useEffect } from "react";
import {
  getEmployerJobPostings,
  createJobPosting,
  toggleJobPostingPublish,
  boostJobPosting,
  type JobPosting,
} from "@/lib/actions/employer/job-postings";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { JobPostingForm } from "./job-posting-form";
import { JobPostingList } from "./job-posting-list";

export function JobPostingManager() {
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPosting, setEditingPosting] = useState<JobPosting | null>(null);

  useEffect(() => {
    loadPostings();
  }, []);

  const loadPostings = async () => {
    setLoading(true);
    try {
      const data = await getEmployerJobPostings();
      setPostings(data);
    } catch (error: any) {
      alert(error.message || "Failed to load job postings");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await toggleJobPostingPublish(id, !currentStatus);
      await loadPostings();
    } catch (error: any) {
      alert(error.message || "Failed to update job posting");
    }
  };

  const handleBoost = async (id: string) => {
    try {
      await boostJobPosting(id, 30);
      await loadPostings();
      alert("Job posting boosted for 30 days!");
    } catch (error: any) {
      alert(error.message || "Failed to boost job posting");
    }
  };

  if (showForm || editingPosting) {
    return (
      <JobPostingForm
        posting={editingPosting}
        onSuccess={() => {
          setShowForm(false);
          setEditingPosting(null);
          loadPostings();
        }}
        onCancel={() => {
          setShowForm(false);
          setEditingPosting(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
            Job Postings
          </h2>
          <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">
            Create and manage your job listings
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Job Posting
        </Button>
      </div>

      {loading ? (
        <Card className="p-12 text-center">
          <p className="text-grey-medium dark:text-gray-400">
            Loading job postings...
          </p>
        </Card>
      ) : (
        <JobPostingList
          postings={postings}
          onTogglePublish={handleTogglePublish}
          onBoost={handleBoost}
          onEdit={(posting) => setEditingPosting(posting)}
        />
      )}
    </div>
  );
}
