"use client";

import { useSession } from "next-auth/react";

export function ImpersonationBanner() {
  const { data: session } = useSession();
  const impersonating = session?.impersonating ?? false;

  if (!impersonating) return null;

  return (
    <div className="sticky top-0 z-[60] w-full bg-red-600 text-white text-center py-2 px-4 text-sm font-medium shadow">
      Viewing as user — Admin controls disabled
    </div>
  );
}
