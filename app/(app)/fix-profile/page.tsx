import { Suspense } from "react";
import FixProfileClient from "./FixProfileClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <FixProfileClient />
    </Suspense>
  );
}
