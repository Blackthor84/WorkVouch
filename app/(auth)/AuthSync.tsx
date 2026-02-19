"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AuthSync() {
  const router = useRouter();

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        console.log("AUTH ROLE:", (session.user as { app_metadata?: { role?: string } }).app_metadata?.role);
      }
    });
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        console.log("AUTH ROLE:", (session.user as { app_metadata?: { role?: string } }).app_metadata?.role);
      }
      if (event !== "SIGNED_IN" || !session?.user) return;

      const role = String((session.user as { app_metadata?: { role?: string } }).app_metadata?.role ?? "").trim().toLowerCase();
      if (role === "admin" || role === "superadmin") {
        router.push("/admin");
        return;
      }

      try {
        const res = await fetch("/api/user/profile", { credentials: "include" });
        if (!res.ok) {
          router.push("/dashboard");
          return;
        }
        const profile = await res.json();
        const onboardingCompleted = profile?.onboarding_completed === true;

        if (!onboardingCompleted) {
          if (role === "employer") {
            router.push("/employer/onboarding/start");
          } else {
            router.push("/onboarding");
          }
          return;
        }

        if (role === "employer") {
          router.push("/employer/dashboard");
        } else {
          router.push("/dashboard");
        }
      } catch {
        router.push("/dashboard");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
