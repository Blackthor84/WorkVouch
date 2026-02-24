"use client";

import { useEffect, useState } from "react";

type Props = {
  user: {
    id: string;
    role: string;
  } | null;
  children: React.ReactNode;
};

export default function AdminClientLayout({ user, children }: Props) {

  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (user && (user.role === "admin" || user.role === "superadmin")) {
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }
  }, [user]);

  if (!mounted) return null;

  if (!authorized) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Unauthorized</h2>
        <p>You do not have access to this area.</p>
      </div>
    );
  }

  return <>{children}</>;
}
