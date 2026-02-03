"use client";

/**
 * Temporary session debug logger. Remove after confirming auth is stable.
 * Enable with NEXT_PUBLIC_DEBUG_AUTH=true or in development.
 * Helps verify: session lost vs middleware misreading.
 */
import { supabaseBrowser } from "@/lib/supabase-browser";

const DEBUG_AUTH =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_DEBUG_AUTH === "true";

export function initSessionDebug(): (() => void) | undefined {
  if (!DEBUG_AUTH || typeof window === "undefined") return undefined;

  const { data: sub } = supabaseBrowser.auth.onAuthStateChange(
    (event, session) => {
      console.log("[Auth Event]", event);
      console.log("[Auth Session]", session ? "present" : "null", session?.user?.id ?? "-");
    }
  );
  return () => sub?.subscription?.unsubscribe();
}
