import { Suspense } from "react";
import SignupEmployeeClient from "./SignupEmployeeClient";

export const dynamic = "force-dynamic";

export default function SignupEmployeePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-wv-bg text-wv-muted">Loading…</div>}>
      <SignupEmployeeClient />
    </Suspense>
  );
}
