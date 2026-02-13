"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { Session, User } from "@supabase/supabase-js";

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

/** Use in client components instead of next-auth useSession(). */
export function useSupabaseSession(): {
  data: { session: Session | null; user: User | null };
  status: SessionStatus;
} {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const supabase = useMemo(() => supabaseBrowser(), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setStatus(s?.user ? "authenticated" : "unauthenticated");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setStatus(s?.user ? "authenticated" : "unauthenticated");
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return {
    data: { session, user: session?.user ?? null },
    status,
  };
}
