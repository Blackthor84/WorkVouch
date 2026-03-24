"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export type UseUserRoleResult = {
  /**
   * Raw `profiles.role` after load.
   * - `undefined` — initial fetch not finished (wait before redirecting).
   * - `null` — no session.
   * - `"pending"` — signed in but no role chosen yet (empty/null column).
   * - otherwise — DB role string.
   */
  role: string | null | undefined;
  loading: boolean;
};

/**
 * Client-side profile role for UI. Enforcement stays in proxy.ts + server layouts; do not duplicate
 * `redirect("/choose-role")` here or you risk fighting RSC/proxy and causing loops.
 */
export function useUserRole(): UseUserRoleResult {
  const supabase = useMemo(() => supabaseBrowser, []);
  const [role, setRole] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadRole = async () => {
      setLoading(true);
      setRole(undefined);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setRole("pending");
        setLoading(false);
        return;
      }

      const raw = (data as { role?: string | null } | null)?.role;
      const normalized =
        raw == null || String(raw).trim() === "" ? "pending" : String(raw).trim();
      setRole(normalized);
      setLoading(false);
    };

    void loadRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadRole();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { role, loading };
}
