"use client";

import { useState, useEffect } from "react";

/** Persistent banner when impersonating. Shown at top of playground. */
export function ImpersonationBanner() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const check = () => {
      try {
        const cookie = document.cookie
          .split(";")
          .find((c) => c.trim().startsWith("sandbox_playground_impersonation="));
        setActive(Boolean(cookie?.includes("id")));
      } catch {
        setActive(false);
      }
    };
    check();
    window.addEventListener("sandbox-impersonation-change", check);
    return () => window.removeEventListener("sandbox-impersonation-change", check);
  }, []);

  if (!active) return null;

  return (
    <div
      style={{
        padding: "10px 24px",
        background: "#ECFDF5",
        borderBottom: "2px solid #10B981",
        color: "#059669",
        fontWeight: 600,
        fontSize: 14,
      }}
    >
      Impersonating sandbox user — no production data affected
    </div>
  );
}
