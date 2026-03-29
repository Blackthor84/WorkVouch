"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateProfile } from "@/lib/actions/profile";

const FIELDS = ["full_name", "headline", "location", "professional_summary"] as const;

function progress(values: {
  full_name: string;
  headline: string;
  location: string;
  professional_summary: string;
}): number {
  const filled = FIELDS.filter((f) => (values[f] ?? "").trim().length > 0).length;
  return Math.round((filled / FIELDS.length) * 100);
}

type Props = {
  defaultValues: {
    full_name: string;
    headline: string;
    location: string;
    professional_summary: string;
  };
};

export function ProfileEditForm({ defaultValues }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [full_name, setFullName] = useState(defaultValues.full_name);
  const [headline, setHeadline] = useState(defaultValues.headline);
  const [location, setLocation] = useState(defaultValues.location);
  const [professional_summary, setProfessionalSummary] = useState(defaultValues.professional_summary);

  const values = { full_name, headline, location, professional_summary };
  const completedPercent = progress(values);

  /** Save a single field on blur (partial update; does not overwrite others). */
  async function saveField(
    field: "full_name" | "headline" | "location" | "professional_summary",
    value: string
  ) {
    setError(null);
    setSaving(true);
    const payload = { [field]: value } as Parameters<typeof updateProfile>[0];
    const result = await updateProfile(payload);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    const result = await updateProfile({ full_name, headline, location, professional_summary });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Profile {completedPercent}% complete
        </span>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs font-medium text-green-600 dark:text-green-400">Saved</span>
          )}
          <div className="h-2 w-32 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
              style={{ width: `${completedPercent}%` }}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded">
          Saved. You can keep editing or go back to your profile.
        </p>
      )}

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Full Name <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="full_name"
          type="text"
          value={full_name}
          onChange={(e) => setFullName(e.target.value)}
          onBlur={() => saveField("full_name", full_name)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
          placeholder="e.g. Jane Doe"
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          This name will appear on your public WorkVouch profile.
        </p>
      </div>
      <div>
        <label htmlFor="headline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Headline <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="headline"
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          onBlur={() => saveField("headline", headline)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
          placeholder="e.g. Director of Safety & Security"
        />
      </div>
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Location <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onBlur={() => saveField("location", location)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
          placeholder="e.g. California or CA"
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          State or region only (we don’t store city for privacy).
        </p>
      </div>
      <div>
        <label htmlFor="professional_summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Professional summary <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="professional_summary"
          value={professional_summary}
          onChange={(e) => setProfessionalSummary(e.target.value)}
          onBlur={() => saveField("professional_summary", professional_summary)}
          rows={4}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
          placeholder="Short professional summary..."
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <Link
          href="/profile"
          className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Back to profile
        </Link>
      </div>
    </form>
  );
}
