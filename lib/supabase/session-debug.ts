"use client";

/**
 * Temporary session debug logger. Remove after confirming auth is stable.
 * Use to confirm: session persists across navigation, token refresh fires correctly.
 */
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";

const DEBUG_AUTH =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_DEBUG_AUTH === "true";

export function initSessionDebug(): (() => void) | undefined {
  if (!DEBUG_AUTH || typeof window === "undefined") return undefined;

  const { data: sub } = supabaseBrowser().auth.onAuthStateChange(
    (event: AuthChangeEvent, session: Session | null) => {
      console.log("AUTH EVENT:", event);
      console.log("SESSION:", session);
    }
  );
  return () => sub?.subscription?.unsubscribe();
}
