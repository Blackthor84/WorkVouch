"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { Session, User } from "@supabase/supabase-js";

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * Use in client components. Uses secure supabase.auth.getUser() (not getSession()).
 * Prefer data.user over data.session?.user.
 */
export function useSupabaseSession(): {
  data: { session: Session | null; user: User | null };
  status: SessionStatus;
} {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const supabase = useMemo(() => supabaseBrowser, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ?? null);
      setStatus(u ? "authenticated" : "unauthenticated");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setUser(s?.user ?? null);
      setStatus(s?.user ? "authenticated" : "unauthenticated");
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const session: Session | null = user ? ({ user } as Session) : null;
  return {
    data: { session, user: user ?? null },
    status,
  };
}
