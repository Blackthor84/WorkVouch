"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserGroupIcon } from "@heroicons/react/24/outline";

/**
 * Section 5 — Dashboard prompt: Expand Your Trust Network
 * Invite coworkers, managers, or clients to confirm work history.
 */
export function ExpandTrustNetworkCard() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-[#0F172A] dark:text-gray-100 mb-2">
        Expand Your Trust Network
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Invite coworkers, managers, or clients to confirm your work history. Each verification
        strengthens your profile and grows the WorkVouch trust network.
      </p>
      <Button href="/coworker-matches" className="w-full sm:w-auto">
        <UserGroupIcon className="h-5 w-5 mr-2" />
        Send Verification Request
      </Button>
    </Card>
  );
}
