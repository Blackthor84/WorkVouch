"use client";

import { useState, useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  // ✅ ALL hooks first
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ returns only AFTER hooks
  if (!mounted) return null;

  return (
    <div>
      {children}
    </div>
  );
}
