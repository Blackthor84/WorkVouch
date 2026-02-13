"use client";

import { useState, useEffect, useMemo } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useSupabaseSession } from "@/lib/hooks/useSupabaseSession";
import { calculateTrustScore } from "@/lib/trust-score";
import Link from "next/link";

/**
 * Worker Dashboard — employee-only.
 * Reputation score, career stability, verification %, profile visibility.
 * Growth-focused; no employer metrics.
 */
export default function WorkerDashboard() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { data: session } = useSupabaseSession();
  const user = session?.user ?? null;
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [trustScore, setTrustScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        // Fetch profile
        const profileRes = await fetch(`/api/user/profile?userId=${user.id}`);
        const profileData = await profileRes.json();
        setProfile(profileData);

        // Fetch job history
        const jobsRes = await fetch(`/api/user/jobs?userId=${user.id}`);
        const jobsData = await jobsRes.json();
        setJobs(jobsData.jobs || []);

        // Calculate reputation score (internal: trust_score)
        // TODO: Fetch actual data for reputation score calculation
        const score = calculateTrustScore(
          {
            coworkerAgreement: 0.8,
            peerReliabilityHistory: 0.75,
            verifiedCoworkersCount: 5,
            jobHistoryConsistency: 0.9,
            flagsCount: 0,
            endorsementsCount: 10,
          },
          "basic"
        );
        setTrustScore(score);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Worker Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your verified work profile and track your reputation score
          </p>
        </div>

        {/* Reputation Score Card */}
        {trustScore && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-8">
            <h2 className="text-xl font-semibold mb-2">Your Reputation Score</h2>
            <div className="flex items-center space-x-4">
              <div className="text-5xl font-bold">{trustScore.score}</div>
              <div>
                <p className="text-blue-100">out of 100</p>
                <p className="text-sm text-blue-200">
                  {trustScore.score >= 80
                    ? "Excellent"
                    : trustScore.score >= 60
                    ? "Good"
                    : trustScore.score >= 40
                    ? "Fair"
                    : "Needs Improvement"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profile completeness % */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Profile completeness</h3>
          <p className="text-3xl font-bold text-gray-900">
            {profile?.full_name && profile?.email ? Math.min(100, 40 + jobs.length * 15 + (jobs.some((j) => j.verifications?.length) ? 20 : 0)) : 25}%
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Add jobs and get confirmations to grow your profile
          </p>
        </div>

        {/* Quick Stats — verification % and confirmation breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Job history
            </h3>
            <p className="text-3xl font-bold text-gray-900">{jobs.length}</p>
            <Link
              href="/dashboard/worker/jobs"
              className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
            >
              Manage jobs →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Verifications
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {jobs.reduce((acc, job) => acc + (job.verifications?.length || 0), 0)}
            </p>
            <Link
              href="/dashboard/worker/verifications"
              className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
            >
              View verifications →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Profile visibility
            </h3>
            <p className="text-3xl font-bold text-gray-900">—</p>
            <p className="text-sm text-gray-500 mt-2">
              Employers can discover you when your profile is complete
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {jobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                className="border-b border-gray-200 pb-4 last:border-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {job.job_title} at {job.company_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {job.start_date} - {job.end_date || "Present"}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {job.verifications?.length || 0} verifications
                  </span>
                </div>
              </div>
            ))}
            {jobs.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No job history yet.{" "}
                <Link href="/dashboard/worker/jobs/add" className="text-blue-600">
                  Add your first job →
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Action buttons — growth-focused */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/worker/jobs/add"
            className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition text-center"
          >
            <h3 className="font-semibold mb-2">Add job</h3>
            <p className="text-sm text-blue-100">
              Add a new job to your verified profile
            </p>
          </Link>
          <Link
            href="/coworker-matches"
            className="bg-emerald-600 text-white rounded-lg p-6 hover:bg-emerald-700 transition text-center"
          >
            <h3 className="font-semibold mb-2">Request confirmation</h3>
            <p className="text-sm text-emerald-100">
              Ask coworkers to confirm your employment
            </p>
          </Link>
          <Link
            href="/dashboard/worker/profile/edit"
            className="bg-gray-100 text-gray-900 rounded-lg p-6 hover:bg-gray-200 transition text-center"
          >
            <h3 className="font-semibold mb-2">Improve profile</h3>
            <p className="text-sm text-gray-600">
              Update your profile to stand out
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
