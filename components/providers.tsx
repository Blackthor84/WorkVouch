"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initSessionDebug } from "@/lib/supabase/session-debug";
import { PreviewProvider } from "@/lib/preview-context";

const PreviewInitializerClient = dynamic(
  () => import("@/lib/preview-context/PreviewInitializer.client"),
  { ssr: false }
);

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const cleanup = initSessionDebug();
    return () => cleanup?.();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PreviewProvider>
        <Suspense fallback={null}>
          <PreviewInitializerClient />
        </Suspense>
        {children}
      </PreviewProvider>
    </QueryClientProvider>
  );
}
