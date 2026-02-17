"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AuthSync() {
  const router = useRouter();

  useEffect(() => {
    supabaseBrowser.auth.getSession();
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange(async (event, session) => {
      if (event !== "SIGNED_IN" || !session?.user) return;

      try {
        const res = await fetch("/api/user/profile", { credentials: "include" });
        if (!res.ok) return;
        const profile = await res.json();
        const role = (profile?.role ?? "").trim().toLowerCase();
        const onboardingCompleted = profile?.onboarding_completed === true;

        if (role === "admin" || role === "superadmin") {
          router.push("/admin");
          return;
        }

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
