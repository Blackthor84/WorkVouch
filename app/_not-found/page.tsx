import { Suspense } from "react";
import NotFoundClient from "./NotFoundClient";

export default function NotFoundPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <NotFoundClient />
    </Suspense>
  );
}
