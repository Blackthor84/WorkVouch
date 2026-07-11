import { Suspense } from "react";
import SignupEmployerClient from "./SignupEmployerClient";

export const dynamic = "force-dynamic";

export default function SignupEmployerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-wv-bg text-wv-muted">Loading…</div>}>
      <SignupEmployerClient />
    </Suspense>
  );
}
