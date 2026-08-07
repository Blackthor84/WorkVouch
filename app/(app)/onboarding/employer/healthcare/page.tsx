import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LegacyEmployerOnboardingRedirect() {
  redirect("/employer/onboarding/start");
}
