import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy route: redirect to canonical employer onboarding. */
export default function LegacyOnboardingEmployerRedirectPage() {
  redirect("/employer/onboarding/start");
}
