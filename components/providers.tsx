"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { initSessionDebug } from "@/lib/supabase/session-debug";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const cleanup = initSessionDebug();
    return () => cleanup?.();
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
