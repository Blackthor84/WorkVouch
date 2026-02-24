"use client";

import { useEffect, useState } from "react";

export type UseUserResult = {
  id?: string;
  email?: string;
  role?: string;
  __impersonated?: boolean;
} | null;

/**
 * Client hook: fetches /api/user/me and returns { user }. Use for role checks (e.g. admin bypass).
 */
export function useUser(): { user: UseUserResult } {
  const [user, setUser] = useState<UseUserResult>(null);

  useEffect(() => {
    fetch("/api/user/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user?: UseUserResult } | null) => setUser(data?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  return { user };
}
