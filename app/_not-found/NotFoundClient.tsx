"use client";

import { useSearchParams } from "next/navigation";

export default function NotFoundClient() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold">Page Not Found</h1>
      {reason && (
        <p className="mt-2 text-slate-600">
          Reason: {reason}
        </p>
      )}
    </div>
  );
}
