"use client";

import { SmartGuide } from "@/components/guidance/SmartGuide";

/** Fixed guide control for routes that do not use WorkVouch navbar (e.g. /employer/*). */
export function EmployerGuidanceShell() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <SmartGuide className="bg-white shadow-md" />
    </div>
  );
}
