"use client";

import { useEffect, useState } from "react";

export function ImpersonationBanner() {
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    fetch("/api/admin/impersonate/status")
      .then((r) => r.json())
      .then((data) => setImpersonating(Boolean(data?.impersonating)))
      .catch(() => setImpersonating(false));
  }, []);

  if (!impersonating) return null;

  return (
    <div className="sticky top-0 z-[60] w-full bg-red-600 text-white text-center py-2.5 px-4 text-sm font-semibold shadow-md" role="alert" aria-live="polite">
      You are viewing as another user — impersonation active (admin actions logged)
    </div>
  );
}
