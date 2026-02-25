"use client";

import { useSearchParams } from "next/navigation";

export default function FixProfileClient() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <div style={{ padding: 40 }}>
      <h1>Fix Your Profile</h1>
      {reason && <p>Reason: {reason}</p>}
    </div>
  );
}
