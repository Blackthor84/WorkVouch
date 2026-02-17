"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface ProfileCompleteGateProps {
  /** Short label for the restricted action (e.g. "Candidate search") */
  feature: string;
  className?: string;
}

/**
 * Shown when an employer tries a restricted action that requires a complete company profile.
 * Explains what’s missing and how to unlock (complete profile); non-blocking, explanatory.
 */
export function ProfileCompleteGate({ feature, className = "" }: ProfileCompleteGateProps) {
  return (
    <Card className={`p-6 flex flex-col gap-3 ${className}`}>
      <div className="flex items-start gap-3">
        <InformationCircleIcon className="h-6 w-6 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-grey-dark dark:text-gray-200">
            {feature} works best with a complete company profile.
          </p>
          <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">
            Add your company name, industry, and complete verification so candidates and search results are fully available. You can do this in Settings.
          </p>
          <Button variant="secondary" size="sm" className="mt-3" asChild>
            <Link href="/employer/settings">Complete company profile</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
