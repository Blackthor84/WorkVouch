import { HealthcareCoworkersClient } from "./healthcare-coworkers-client";

// Mark as dynamic to prevent build-time prerendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function HealthcareCoworkersStep() {
  return (
    <main className="min-h-screen bg-background dark:bg-[#0D1117]">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <HealthcareCoworkersClient />
      </div>
    </main>
  );
}
