"use client";

import { createContext, useContext } from "react";

export type AuthContextType = {
  /**
   * Profile-related role string when known.
   * - `undefined` — still loading; do not redirect or treat as missing.
   * - `null` — resolved: no role in context (e.g. signed out for this provider).
   * - `"pending"` — must complete /choose-role.
   * - `"user"` / `"employer"` / etc. — allow normal gates.
   */
  role: string | null | undefined;
  loading: boolean;
  /** True when admin layout determined current user is founder (e.g. email match). Used for internal feature gating. */
  isFounder?: boolean;
};

const defaultState: AuthContextType = {
  role: undefined,
  loading: true,
  isFounder: false,
};

export const AuthContext = createContext<AuthContextType>(defaultState);

export const useAuth = () => useContext(AuthContext);

type AuthContextProviderProps = {
  role?: string | null;
  loading?: boolean;
  isFounder?: boolean;
  children: React.ReactNode;
};

export function AuthContextProvider({
  role,
  loading = false,
  isFounder = false,
  children,
}: AuthContextProviderProps) {
  const resolvedRole: string | null | undefined = loading ? undefined : (role ?? null);
  return (
    <AuthContext.Provider value={{ role: resolvedRole, loading, isFounder }}>
      {children}
    </AuthContext.Provider>
  );
}
