"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Seasonal / Temporary" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
];

export default function AddJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("US");
  const [state, setState] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [employmentType, setEmploymentType] = useState("full_time");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [coworkerEmails, setCoworkerEmails] = useState<string[]>([""]);

  function addCoworker() {
    setCoworkerEmails((prev) => [...prev, ""]);
  }

  function setCoworkerAt(i: number, value: string) {
    setCoworkerEmails((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  function removeCoworker(i: number) {
    setCoworkerEmails((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!companyName.trim() || !jobTitle.trim() || !startDate) {
      setError("Company name, job title, and start date are required.");
      return;
    }

    const locationStr =
      country === "US" && state
        ? `${state}, ${country}`
        : country
          ? country
          : null;

    setLoading(true);
    try {
      const res = await fetch("/api/jobs/create-with-verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName.trim(),
          job_title: jobTitle.trim(),
          start_date: startDate,
          end_date: isCurrent ? null : endDate || null,
          is_current: isCurrent,
          employment_type: employmentType,
          location: locationStr,
          supervisor_name: managerName.trim() || null,
          coworker_emails: coworkerEmails
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to save job.");
        setLoading(false);
        return;
      }

      router.push(`/jobs/new/success?job_id=${encodeURIComponent(data.job_id ?? "")}&sent=${data.verification_requests_sent ?? 0}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Add Verified Job
      </h1>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
        Add a job and invite coworkers to verify your employment. Recommend at least 2 coworkers.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job details */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Job details
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company name *
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company Name"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Job title *
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Job Title"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department (optional)
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Department"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
        </section>

        {/* Location — only State and Country are stored (privacy); street/city are optional for your reference only */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Location
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Street address (optional, not stored)
            </label>
            <input
              type="text"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="Street Address"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              City (optional, not stored)
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <p className="text-xs text-gray-500">
            Only state and country are stored to protect privacy.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            {country === "US" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">Select state</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Employment dates */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Employment dates
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_current"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_current" className="text-sm text-gray-700 dark:text-gray-300">
              I currently work here
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isCurrent}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>
        </section>

        {/* Employment type */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Employment type
          </h2>
          <div className="flex flex-wrap gap-2">
            {EMPLOYMENT_TYPES.map((t) => (
              <label key={t.value} className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="employment_type"
                  value={t.value}
                  checked={employmentType === t.value}
                  onChange={() => setEmploymentType(t.value)}
                  className="border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Manager / supervisor */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Manager / supervisor (optional)
          </h2>
          <div>
            <input
              type="text"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="Manager name"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-2"
            />
            <input
              type="email"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              placeholder="Manager email (optional, not stored for privacy)"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
        </section>

        {/* Coworker verification */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Coworker verification
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add at least 2 coworker emails. They will receive a request to confirm your employment.
          </p>
          {coworkerEmails.map((email, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setCoworkerAt(i, e.target.value)}
                placeholder="coworker@email.com"
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => removeCoworker(i)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addCoworker}
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            + Add another coworker
          </button>
        </section>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save job"}
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
