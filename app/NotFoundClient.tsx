"use client";

import { useSearchParams } from "next/navigation";

export default function NotFoundClient() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  return (
    <div style={{ padding: 40 }}>
      <h1>404 – Page Not Found</h1>
      {from && <p>Redirected from: {from}</p>}
    </div>
  );
}
