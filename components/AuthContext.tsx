"use client";

import { createContext, useContext } from "react";

export type AuthContextType = {
  role: string | null;
  loading: boolean;
};

const defaultState: AuthContextType = {
  role: null,
  loading: true,
};

export const AuthContext = createContext<AuthContextType>(defaultState);

export const useAuth = () => useContext(AuthContext);

type AuthContextProviderProps = {
  role: string | null;
  loading?: boolean;
  children: React.ReactNode;
};

export function AuthContextProvider({ role, loading = false, children }: AuthContextProviderProps) {
  return (
    <AuthContext.Provider value={{ role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
