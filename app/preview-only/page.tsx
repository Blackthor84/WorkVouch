"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CareersGrid from "@/components/CareersGrid";
import { useSupabaseSession } from "@/lib/hooks/useSupabaseSession";

export default function PreviewOnlyPage() {
  const { data: session, status } = useSupabaseSession();
  const router = useRouter();
  const user = session?.user ?? null;
  const [roleCheck, setRoleCheck] = useState<"beta" | "other" | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && user?.id) {
      fetch("/api/user/me")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          setRoleCheck(data?.role === "beta" ? "beta" : "other");
        })
        .catch(() => setRoleCheck("other"));
    }
  }, [user?.id, status, router]);

  useEffect(() => {
    if (roleCheck === "other") router.push("/dashboard");
  }, [roleCheck, router]);

  const isBeta = roleCheck === "beta";
  const loading = status === "loading" || (status === "authenticated" && roleCheck === null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (roleCheck === "other") {
    return null; // useEffect will redirect
  }

  if (!isBeta) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-yellow-800">Beta Preview Access</h1>
              <p className="text-sm text-yellow-700 mt-1">
                You're viewing WorkVouch in preview mode. Subscription features are disabled.
              </p>
            </div>
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Sign Up for Full Access
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-10 px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4">Welcome to WorkVouch Preview</h2>
          <p className="text-lg text-gray-700 mb-4">
            You have temporary preview access to explore WorkVouch. This allows you to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li>Browse career pages and learn about WorkVouch</li>
            <li>View employer and employee features</li>
            <li>Explore the platform's capabilities</li>
            <li>See how WorkVouch can help verify work history</li>
          </ul>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-semibold mb-2">Preview Limitations:</p>
            <ul className="list-disc pl-6 space-y-1 text-blue-700 text-sm">
              <li>Subscription and payment features are disabled</li>
              <li>You cannot create a full account or subscribe</li>
              <li>Some features may be limited or read-only</li>
            </ul>
          </div>
        </div>

        {/* Career Grid */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">Explore Careers</h3>
          <CareersGrid />
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Ready for Full Access?</h3>
          <p className="mb-6 opacity-90">
            Sign up for a full account to start verifying your work history or hiring with confidence.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition shadow-lg"
          >
            Sign Up for Full Access
          </Link>
        </div>
      </div>
    </div>
  );
}
