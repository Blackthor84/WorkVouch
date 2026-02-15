"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { logEvent } from "@/lib/useEventLogger";

export function PageViewTracker() {
  const path = usePathname();

  useEffect(() => {
    if (path == null) return;
    logEvent("page_view", undefined, { path });
  }, [path]);

  return null;
}
