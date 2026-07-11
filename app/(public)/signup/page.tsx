import { Suspense } from "react";
import SignupClient from "./SignupClient";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-wv-bg text-wv-muted">Loading…</div>}>
      <SignupClient />
    </Suspense>
  );
}
