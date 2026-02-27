"use client";

import { createContext, useContext } from "react";

export type AuthContextType = {
  role: string | null;
  loading: boolean;
  /** True when admin layout determined current user is founder (e.g. email match). Used for internal feature gating. */
  isFounder?: boolean;
};

const defaultState: AuthContextType = {
  role: null,
  loading: true,
  isFounder: false,
};

export const AuthContext = createContext<AuthContextType>(defaultState);

export const useAuth = () => useContext(AuthContext);

type AuthContextProviderProps = {
  role: string | null;
  loading?: boolean;
  isFounder?: boolean;
  children: React.ReactNode;
};

export function AuthContextProvider({ role, loading = false, isFounder = false, children }: AuthContextProviderProps) {
  return (
    <AuthContext.Provider value={{ role, loading, isFounder }}>
      {children}
    </AuthContext.Provider>
  );
}
