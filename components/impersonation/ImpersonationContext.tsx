"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ImpersonationContextSession = {
  impersonating: boolean;
  actorType?: string;
  scenario?: string;
};

export type ImpersonationState = {
  isImpersonating: boolean;
  impersonatedUserId: string | null;
  startedAt: number | null;
  /** When impersonating, the effective user from /api/user/me */
  effectiveUser: {
    id: string;
    email?: string;
    full_name?: string;
    role?: string;
  } | null;
  /** Scenario overlay from simulation cookie (session.impersonation) */
  impersonation: ImpersonationContextSession | undefined;
  loading: boolean;
};

type ImpersonationContextValue = ImpersonationState & {
  exitImpersonation: () => Promise<void>;
  refresh: () => Promise<void>;
};

const ImpersonationContext = createContext<ImpersonationContextValue | null>(null);

export function useImpersonation(): ImpersonationContextValue {
  const ctx = useContext(ImpersonationContext);
  if (!ctx) {
    return {
      isImpersonating: false,
      impersonatedUserId: null,
      startedAt: null,
      effectiveUser: null,
      impersonation: undefined,
      loading: false,
      exitImpersonation: async () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}

type ImpersonationProviderProps = { children: ReactNode };

export function ImpersonationProvider({ children }: ImpersonationProviderProps) {
  const [state, setState] = useState<ImpersonationState>({
    isImpersonating: false,
    impersonatedUserId: null,
    startedAt: null,
    effectiveUser: null,
    impersonation: undefined,
    loading: true,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const statusRes = await fetch("/api/admin/impersonate/status", { credentials: "include" });
      const status = await statusRes.json().catch(() => ({}));
      const impersonating = Boolean(status?.impersonating);

      if (!impersonating) {
        setState({
          isImpersonating: false,
          impersonatedUserId: null,
          startedAt: null,
          effectiveUser: null,
          impersonation: undefined,
          loading: false,
        });
        return;
      }

      let effectiveUser: ImpersonationState["effectiveUser"] = null;
      try {
        const meRes = await fetch("/api/user/me", { credentials: "include" });
        if (meRes.ok) {
          const me = await meRes.json();
          effectiveUser = {
            id: me.id,
            email: me.email,
            full_name: me.full_name,
            role: me.role,
          };
        }
      } catch {
        // ignore
      }

      setState({
        isImpersonating: true,
        impersonatedUserId: status.impersonatedUserId ?? null,
        startedAt: status.startedAt ?? null,
        effectiveUser,
        impersonation: status?.impersonation ?? undefined,
        loading: false,
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const exitImpersonation = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/impersonate/exit", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      const redirectUrl = data?.redirectUrl ?? "/admin";
      window.location.href = redirectUrl;
    } catch {
      window.location.href = "/admin";
    }
  }, []);

  const value = useMemo<ImpersonationContextValue>(
    () => ({
      ...state,
      exitImpersonation,
      refresh,
    }),
    [state, exitImpersonation, refresh]
  );

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
}
