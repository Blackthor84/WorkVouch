"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function FixProfilePage() {
  const router = useRouter();
  const supabase = supabaseBrowser;
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleCreateProfile = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      setMessage(`Found user: ${user.email} (${user.id})`);

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (existingProfile) {
        setMessage(
          `Profile already exists! ${JSON.stringify(existingProfile)}`,
        );
        return;
      }

      // Profiles are created by DB trigger on auth.users; no client-side insert.
      setMessage(
        "No profile found. It should be created automatically when you sign up. Try signing out and back in, or contact support if the problem persists.",
      );
    } catch (err: any) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="rounded-2xl bg-white dark:bg-[#1A1F2B] p-6 shadow-md border border-grey-background dark:border-[#374151]">
        <h1 className="mb-4 text-2xl font-bold text-grey-dark dark:text-gray-200">
          Fix Profile
        </h1>
        <p className="mb-4 text-grey-medium dark:text-gray-400">
          This page will manually create your profile if it doesn&apos;t exist.
        </p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-sm text-green-800 dark:text-green-300">
            {message}
          </div>
        )}

        <button
          onClick={handleCreateProfile}
          disabled={loading}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white px-5 py-2.5 font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? "Creating profile..." : "Create My Profile"}
        </button>

        <div className="mt-6">
          <a
            href="/login"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            ← Back to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
