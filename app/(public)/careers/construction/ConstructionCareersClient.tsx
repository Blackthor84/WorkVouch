"use client";

import { useSearchParams } from "next/navigation";

export default function ConstructionCareersClient() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  return (
    <div style={{ padding: 40 }}>
      <h1>Construction Careers</h1>
      {ref && <p>Referral source: {ref}</p>}
    </div>
  );
}
