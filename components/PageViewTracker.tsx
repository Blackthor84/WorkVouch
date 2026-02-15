"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { logEvent } from "@/lib/useEventLogger";

export function PageViewTracker() {
  const path = usePathname();

  useEffect(() => {
    logEvent("page_view", path);
  }, [path]);

  return null;
}
