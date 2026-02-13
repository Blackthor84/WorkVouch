"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useSupabaseReady } from "@/lib/hooks/useSupabaseReady";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HEALTHCARE_ROLES = [
  "CNA",
  "HHA",
  "Medical Assistant",
  "Patient Care Tech",
  "Dental Assistant",
  "Medical Receptionist",
  "Phlebotomist",
  "Pharmacy Technician",
  "ER Tech",
  "Caregiver",
  "Lab Assistant",
  "Sterile Processing Tech",
];

export function JobPostClient() {
  const router = useRouter();
  const authReady = useSupabaseReady();
  const [jobTitle, setJobTitle] = useState("");
  const [workSetting, setWorkSetting] = useState("");
  const [location, setLocation] = useState("");
  const [requiredCertifications, setRequiredCertifications] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      console.log("Supabase auth check triggered in: app/(app)/onboarding/employer/healthcare/job-post/job-post-client.tsx");
      const {
        data: { user: currentUser },
      } = await supabaseBrowser.auth.getUser();

      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);
    }

    checkUser();
  }, [router]);

  if (!authReady) return null;

  const handleSubmit = async () => {
    if (!jobTitle || !workSetting || !location) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Parse certifications (comma-separated)
      const certificationsArray = requiredCertifications
        ? requiredCertifications
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c.length > 0)
        : [];

      // Get employer account
      type EmployerAccountRow = { id: string };
      const { data: employerAccount } = await (supabaseBrowser as any)
        .from("employer_accounts")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!employerAccount) {
        alert(
          "Employer account not found. Please complete employer onboarding first.",
        );
        setLoading(false);
        return;
      }

      const employerAccountTyped = employerAccount as EmployerAccountRow;

      // Insert job posting
      const { error: jobError } = await (supabaseBrowser as any)
        .from("job_postings")
        .insert([
          {
            employer_id: employerAccountTyped.id,
            job_title: jobTitle,
            industry: "healthcare",
            work_setting: workSetting,
            location,
            required_certifications:
              certificationsArray.length > 0 ? certificationsArray : null,
            description: description || null,
            status: "active",
          },
        ]);

      if (jobError) {
        console.error("Error creating job posting:", jobError);
        alert("Error creating job posting. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/employer/dashboard");
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
        Post a Healthcare Job
      </h1>
      <p className="text-grey-medium dark:text-gray-400 mb-6">
        Create a job posting to attract qualified healthcare professionals
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="jobTitle">Job Title *</Label>
          <select
            id="jobTitle"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          >
            <option value="">-- Select Job Title --</option>
            {HEALTHCARE_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="workSetting">Work Setting *</Label>
          <select
            id="workSetting"
            value={workSetting}
            onChange={(e) => setWorkSetting(e.target.value)}
            className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          >
            <option value="">-- Select Work Setting --</option>
            <option value="Hospital">Hospital</option>
            <option value="Nursing Home">Nursing Home</option>
            <option value="Assisted Living">Assisted Living</option>
            <option value="Home Health Agency">Home Health Agency</option>
            <option value="Dental Office">Dental Office</option>
            <option value="Clinic / Outpatient">Clinic / Outpatient</option>
            <option value="Rehab Center">Rehab Center</option>
            <option value="Lab / Diagnostics">Lab / Diagnostics</option>
          </select>
        </div>

        <div>
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            type="text"
            placeholder="e.g., New York, NY"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="requiredCertifications">
            Required Certifications (comma-separated)
          </Label>
          <Input
            id="requiredCertifications"
            type="text"
            placeholder="e.g., BLS, CPR, CNA License"
            value={requiredCertifications}
            onChange={(e) => setRequiredCertifications(e.target.value)}
          />
          <p className="text-xs text-grey-medium dark:text-gray-400 mt-1">
            Separate multiple certifications with commas
          </p>
        </div>

        <div>
          <Label htmlFor="description">Job Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Describe the position, responsibilities, and requirements..."
          />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || !jobTitle || !workSetting || !location}
        className="w-full"
      >
        {loading ? "Posting..." : "Post Job"}
      </Button>
    </Card>
  );
}
