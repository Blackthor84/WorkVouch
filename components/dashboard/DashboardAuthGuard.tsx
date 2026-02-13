"use client";

import { useSupabaseSession } from "@/lib/hooks/useSupabaseSession";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSupabaseSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") return <div className="flex items-center justify-center min-h-[40vh]">Loading...</div>;
  if (status === "unauthenticated") return null;

  return <>{children}</>;
}
