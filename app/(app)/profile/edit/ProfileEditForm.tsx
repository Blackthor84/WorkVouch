"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateProfile } from "@/lib/actions/profile";

type Props = {
  defaultValues: {
    full_name: string;
    headline: string;
    location: string;
    bio: string;
  };
};

export function ProfileEditForm({ defaultValues }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [full_name, setFullName] = useState(defaultValues.full_name);
  const [headline, setHeadline] = useState(defaultValues.headline);
  const [location, setLocation] = useState(defaultValues.location);
  const [bio, setBio] = useState(defaultValues.bio);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await updateProfile({ full_name, headline, location, bio });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/profile");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Full Name
        </label>
        <input
          id="full_name"
          type="text"
          value={full_name}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
          placeholder="e.g. Jane Doe"
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          This name will appear on your public WorkVouch profile.
        </p>
      </div>
      <div>
        <label htmlFor="headline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Headline
        </label>
        <input
          id="headline"
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
          placeholder="e.g. Director of Safety & Security"
        />
      </div>
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Location
        </label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
          placeholder="e.g. San Francisco, CA"
        />
      </div>
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
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
          {saving ? "Saving…" : "Save changes"}
        </button>
        <Link
          href="/profile"
          className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
