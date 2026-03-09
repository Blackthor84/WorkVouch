"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

export default function VerifyPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.jobId as string | undefined;

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<{ company_name?: string; job_title?: string } | null>(null);

  useEffect(() => {
    if (!jobId) return;
    supabase
      .from("jobs")
      .select("company_name, job_title")
      .eq("id", jobId)
      .maybeSingle()
      .then(({ data }) => setJob((data as { company_name?: string; job_title?: string } | null) ?? null));
  }, [jobId]);

  async function confirmJob() {
    if (!jobId) {
      setError("Invalid job.");
      return;
    }
    setError(null);
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      setError("Please sign in to confirm employment.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await (supabase as any)
      .from("job_verifications")
      .insert({
        job_id: jobId,
        verifier_user_id: user.id,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        setError("You have already confirmed this employment.");
      } else {
        setError(insertError.message || "Failed to record verification.");
      }
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (!jobId) {
    return (
      <div className="max-w-xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Invalid link</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">This verification link is invalid or missing the job ID.</p>
        <Link href="/" className="text-blue-600 hover:underline">Go home</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6 text-green-700 dark:text-green-400">Verification recorded</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Thank you. Your confirmation has been recorded.
        </p>
        <Link href="/" className="text-blue-600 hover:underline">Go home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Confirm Employment</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Did you work with this person at the company listed?
        {job?.company_name && (
          <span className="block mt-2 font-medium text-gray-900 dark:text-white">
            {job.company_name}
            {job.job_title ? ` — ${job.job_title}` : ""}
          </span>
        )}
      </p>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        onClick={confirmJob}
        disabled={loading}
        className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Recording…" : "Confirm Employment"}
      </button>

      <p className="mt-6 text-sm text-gray-500">
        You must be signed in to confirm. <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
