import { redirect } from "next/navigation";
import { Suspense } from "react";
import SignupEmployerClient from "./SignupEmployerClient";

export const dynamic = "force-dynamic";

type SignupEmployerPageProps = {
  searchParams: Promise<{ sandbox?: string; sandboxId?: string }>;
};

/**
 * Production employer registration uses /signup or /employer/onboarding.
 * This route is reserved for admin sandbox lab flows (?sandbox=true&sandboxId=…).
 */
export default async function SignupEmployerPage({ searchParams }: SignupEmployerPageProps) {
  const params = await searchParams;
  const sandboxId = params.sandboxId?.trim();
  const isSandboxLabRoute = params.sandbox === "true" && !!sandboxId;

  if (!isSandboxLabRoute) {
    redirect("/signup");
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-wv-bg text-wv-muted">Loading…</div>}>
      <SignupEmployerClient />
    </Suspense>
  );
}
