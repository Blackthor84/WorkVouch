"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

type ProfileNameRow = { id: string; full_name: string | null };

/**
 * Client-loaded display name from `profiles` (`.eq("id", user.id).single()`)
 * so the UI updates after auth + Supabase return (avoids stale server-only "User").
 */
export function ProfileDisplayName() {
  const [profile, setProfile] = useState<ProfileNameRow | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (cancelled) return;
      setUser(authUser);

      if (!authUser) {
        setReady(true);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", authUser.id)
        .single();

      if (cancelled) return;

      if (error) {
        console.warn("[ProfileDisplayName] profiles:", error.message);
        setProfile(null);
      } else if (data && data.id === authUser.id) {
        console.log("PROFILE:", data);
        setProfile({ id: data.id, full_name: data.full_name });
      } else {
        setProfile(null);
      }

      setReady(true);
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const text = !ready
    ? "Loading..."
    : !user
      ? "User"
      : profile &&
          profile.full_name != null &&
          String(profile.full_name).trim() !== ""
        ? String(profile.full_name).trim()
        : user.email?.split("@")[0] || "User";

  return (
    <span className="text-xl font-semibold text-gray-900 dark:text-white">
      {text}
    </span>
  );
}
