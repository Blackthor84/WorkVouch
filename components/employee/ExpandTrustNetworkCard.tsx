"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserGroupIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

/**
 * Section 5 — Action panel: Expand Your Trust Network
 * Prompts: Invite coworkers, Verify employment, Strengthen trust profile.
 */
interface ExpandTrustNetworkCardProps {
  /** When provided, primary CTA opens the verification request modal instead of navigating. */
  onRequestVerification?: () => void;
}

export function ExpandTrustNetworkCard({ onRequestVerification }: ExpandTrustNetworkCardProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-[#0F172A] dark:text-gray-100 mb-2">
        Expand Your Trust Network
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        Strengthen your profile and grow the WorkVouch trust network with these actions.
      </p>
      <ul className="space-y-3 mb-6">
        <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
          <span className="flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 p-1.5">
            <UserGroupIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </span>
          <span><strong>Invite coworkers</strong> — Get verified by people you worked with.</span>
        </li>
        <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
          <span className="flex-shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-1.5">
            <BriefcaseIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </span>
          <span><strong>Verify employment</strong> — Confirm roles and tenure with employers.</span>
        </li>
        <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
          <span className="flex-shrink-0 rounded-full bg-violet-100 dark:bg-violet-900/30 p-1.5">
            <ShieldCheckIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </span>
          <span><strong>Strengthen trust profile</strong> — More verifications improve your score.</span>
        </li>
      </ul>
      {onRequestVerification ? (
        <Button onClick={onRequestVerification} className="w-full sm:w-auto">
          <PaperAirplaneIcon className="h-5 w-5 mr-2" />
          Request verification
        </Button>
      ) : (
        <Button href="/verify/request" className="w-full sm:w-auto">
          <PaperAirplaneIcon className="h-5 w-5 mr-2" />
          Request verification
        </Button>
      )}
    </Card>
  );
}
