"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function TestPage() {
  const [status, setStatus] = useState("Loading...");
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const check = async () => {
      const supabase = getSupabaseClient();

      // Check 1: Get user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      setStatus(`User: ${user ? "Found" : "Not found"}`);

      if (userError) {
        setDetails({ error: "User error", message: userError.message });
        return;
      }

      if (!user) {
        setDetails({ error: "Not signed in" });
        return;
      }

      // Check 2: Get profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setDetails({
        user: {
          id: user.id,
          email: user.email,
        },
        profile: profile ? "Found" : "Not found",
        profileError: profileError ? profileError.message : null,
        profileData: profile,
      });

      if (profileError) {
        setStatus(`Profile Error: ${profileError.message}`);
      } else if (profile) {
        setStatus("✅ Everything works! Profile found.");
      } else {
        setStatus("❌ Profile not found");
      }
    };

    check();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="rounded-2xl bg-white dark:bg-[#1A1F2B] p-6 shadow-md border border-grey-background dark:border-[#374151]">
        <h1 className="mb-4 text-2xl font-bold text-grey-dark dark:text-gray-200">
          Diagnostic Test
        </h1>
        <div className="mb-4">
          <p className="text-lg font-semibold text-grey-dark dark:text-gray-200">
            {status}
          </p>
        </div>
        {details && (
          <pre className="overflow-auto rounded-xl bg-grey-background dark:bg-[#111827] p-4 text-sm text-grey-dark dark:text-gray-300 border border-grey-background dark:border-[#374151]">
            {JSON.stringify(details, null, 2)}
          </pre>
        )}
        <div className="mt-4">
          <a
            href="/auth/signin"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Go to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
