"use client";

import { useEffect, useState } from "react";

export function SimulationGuard({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!enabled) {
    return (
      <div style={{ padding: 24 }}>
        <strong>Simulation Disabled</strong>
      </div>
    );
  }

  return <>{children}</>;
}
