"use client";

import { Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initSessionDebug } from "@/lib/supabase/session-debug";
import { PreviewProvider } from "@/lib/preview-context";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const cleanup = initSessionDebug();
    return () => cleanup?.();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <PreviewProvider>
          {children}
        </PreviewProvider>
      </Suspense>
    </QueryClientProvider>
  );
}
