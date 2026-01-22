"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function HealthcareJobClient() {
  const router = useRouter();
  const supabase = createClient();
  const [jobTitle, setJobTitle] = useState("");
  const [employer, setEmployer] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentJob, setCurrentJob] = useState(false);
  const [employmentType, setEmploymentType] = useState("");
  const [certifications, setCertifications] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push("/auth/signin");
        return;
      }

      setUser(currentUser);
    }

    checkUser();
  }, [router, supabase]);

  const handleNext = async () => {
    if (!jobTitle || !employer || !startDate || !employmentType) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Parse certifications (comma-separated)
      const certificationsArray = certifications
        ? certifications
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c.length > 0)
        : [];

      // Insert job
      const supabaseAny = supabase as any;
      const { error: jobError } = await supabaseAny.from("jobs").insert([
        {
          user_id: user.id,
          company_name: employer,
          job_title: jobTitle,
          start_date: startDate,
          end_date: currentJob ? null : endDate || null,
          is_current: currentJob,
          employment_type: employmentType as any,
          industry: "healthcare",
          certifications:
            certificationsArray.length > 0 ? certificationsArray : null,
          work_setting: null,
          is_visible_to_employer: false,
          verification_status: "unverified",
        },
      ]);

      if (jobError) {
        console.error("Error saving job:", jobError);
        alert("Error saving job. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/onboarding/healthcare/coworkers");
    } catch (err: any) {
      console.error("Error:", err);
      alert("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-grey-medium dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <Card className="p-8">
      <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
        Add Your Healthcare Job
      </h1>
      <p className="text-grey-medium dark:text-gray-400 mb-6">
        Tell us about your work experience
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="jobTitle">Job Title *</Label>
          <Input
            id="jobTitle"
            type="text"
            placeholder="e.g., CNA, Medical Assistant, Nurse"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="employer">Employer Name *</Label>
          <Input
            id="employer"
            type="text"
            placeholder="e.g., General Hospital, ABC Clinic"
            value={employer}
            onChange={(e) => setEmployer(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          {!currentJob && (
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="currentJob"
            checked={currentJob}
            onChange={(e) => setCurrentJob(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="currentJob" className="cursor-pointer">
            This is my current job
          </Label>
        </div>

        <div>
          <Label htmlFor="employmentType">Employment Type *</Label>
          <select
            id="employmentType"
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          >
            <option value="">-- Select Type --</option>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="temporary">Temporary</option>
          </select>
        </div>

        <div>
          <Label htmlFor="certifications">
            Certifications (comma-separated)
          </Label>
          <Input
            id="certifications"
            type="text"
            placeholder="e.g., BLS, CPR, CNA License"
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
          />
          <p className="text-xs text-grey-medium dark:text-gray-400 mt-1">
            Separate multiple certifications with commas
          </p>
        </div>
      </div>

      <Button
        onClick={handleNext}
        disabled={
          loading || !jobTitle || !employer || !startDate || !employmentType
        }
        className="w-full"
      >
        {loading ? "Saving..." : "Next"}
      </Button>
    </Card>
  );
}
