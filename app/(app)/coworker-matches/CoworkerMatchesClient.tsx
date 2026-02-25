"use client";

import { useSearchParams } from "next/navigation";

export default function CoworkerMatchesClient() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source");

  return (
    <div style={{ padding: 40 }}>
      <h1>Coworker Matches</h1>
      {source && <p>Source: {source}</p>}
    </div>
  );
}
