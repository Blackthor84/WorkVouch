"use client";

import { useState } from "react";
import {
  createJobPosting,
  updateJobPosting,
  type JobPosting,
} from "@/lib/actions/employer/job-postings";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { INDUSTRIES_OPTIONS } from "@/lib/constants/industries";

interface JobPostingFormProps {
  posting?: JobPosting | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function JobPostingForm({
  posting,
  onSuccess,
  onCancel,
}: JobPostingFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: posting?.title || "",
    description: posting?.description || "",
    location: posting?.location || "",
    pay_range_min: posting?.pay_range_min?.toString() || "",
    pay_range_max: posting?.pay_range_max?.toString() || "",
    shift: posting?.shift || "",
    requirements: posting?.requirements || "",
    industry: posting?.industry || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        pay_range_min: formData.pay_range_min
          ? parseFloat(formData.pay_range_min)
          : undefined,
        pay_range_max: formData.pay_range_max
          ? parseFloat(formData.pay_range_max)
          : undefined,
        shift: formData.shift || undefined,
        requirements: formData.requirements || undefined,
        industry: formData.industry || undefined,
      };

      if (posting) {
        await updateJobPosting(posting.id, data);
      } else {
        await createJobPosting(data);
      }
      onSuccess();
    } catch (error: any) {
      alert(error.message || "Failed to save job posting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-6">
        {posting ? "Edit Job Posting" : "Create Job Posting"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
            Job Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-2"
            placeholder="e.g., Security Guard"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
            Description *
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={6}
            className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-2"
            placeholder="Describe the position, responsibilities, and what you're looking for..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
              Location *
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-2"
              placeholder="City, State"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
              Industry
            </label>
            <select
              value={formData.industry}
              onChange={(e) =>
                setFormData({ ...formData, industry: e.target.value })
              }
              className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-2"
            >
              <option value="">All Industries</option>
              {INDUSTRIES_OPTIONS.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
              Pay Range Min ($)
            </label>
            <input
              type="number"
              value={formData.pay_range_min}
              onChange={(e) =>
                setFormData({ ...formData, pay_range_min: e.target.value })
              }
              className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-2"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
              Pay Range Max ($)
            </label>
            <input
              type="number"
              value={formData.pay_range_max}
              onChange={(e) =>
                setFormData({ ...formData, pay_range_max: e.target.value })
              }
              className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-2"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
              Shift
            </label>
            <select
              value={formData.shift}
              onChange={(e) =>
                setFormData({ ...formData, shift: e.target.value })
              }
              className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-2"
            >
              <option value="">Select shift</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Night shift">Night shift</option>
              <option value="Day shift">Day shift</option>
              <option value="Weekend">Weekend</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
            Requirements
          </label>
          <textarea
            value={formData.requirements}
            onChange={(e) =>
              setFormData({ ...formData, requirements: e.target.value })
            }
            rows={4}
            className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-2"
            placeholder="List required certifications, experience, skills, etc."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : posting
                ? "Update Job Posting"
                : "Create Job Posting"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
