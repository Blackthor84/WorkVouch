"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FixProfilePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleCreateProfile = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Not signed in. Please sign in first.");
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

      // Try to create profile
      console.log("Attempting to create profile with:", {
        id: user.id,
        full_name: user.user_metadata?.full_name || "User",
        email: user.email || "",
      });

      const supabaseAny = supabase as any;
      const { data: profile, error: profileError } = await supabaseAny
        .from("profiles")
        .insert([
          {
            id: user.id,
            full_name: user.user_metadata?.full_name || "User",
            email: user.email || "",
          },
        ])
        .select()
        .single();

      console.log("Profile creation response:", { profile, profileError });

      if (profileError) {
        console.error("Full error details:", profileError);
        throw new Error(
          `Profile creation failed: ${profileError.message} (Code: ${profileError.code})`,
        );
      }

      setMessage(`Profile created! ${JSON.stringify(profile)}`);

      // Check if role exists
      const { data: existingRole } = await supabaseAny
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!existingRole) {
        const { error: roleError } = await supabaseAny
          .from("user_roles")
          .insert([
            {
              user_id: user.id,
              role: "user",
            },
          ]);

        if (roleError) {
          setMessage(`Profile created but role failed: ${roleError.message}`);
        } else {
          setMessage("Profile and role created successfully!");
        }
      } else {
        setMessage("Profile and role created successfully!");
      }

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
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
          This page will manually create your profile if it doesn't exist.
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
            href="/auth/signin"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            ← Back to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
