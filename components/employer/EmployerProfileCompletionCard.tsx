"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

type CompletionState = {
  name: boolean;
  industry: boolean;
  location: boolean;
  verification: boolean;
  complete: boolean;
};

export function EmployerProfileCompletionCard() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<CompletionState | null>(null);

  useEffect(() => {
    fetch("/api/employer/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.employer) {
          const e = data.employer;
          const name = !!(e.companyName && e.companyName.trim().length >= 2);
          const industry = !!(e.industryType && String(e.industryType).trim());
          const location = !!(e.location && String(e.location).trim());
          const verification = !!e.claimVerified;
          setState({
            name,
            industry,
            location,
            verification,
            complete: name && industry && verification,
          });
        } else {
          setState(null);
        }
      })
      .catch(() => setState(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-3">
          Company profile
        </h3>
        <p className="text-sm text-grey-medium dark:text-gray-400">Loading…</p>
      </Card>
    );
  }

  if (!state) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-3">
          Company profile
        </h3>
        <p className="text-sm text-grey-medium dark:text-gray-400">
          Unable to load profile status. You can update your company info from the button above.
        </p>
      </Card>
    );
  }

  const Icon = state.complete ? CheckCircleIcon : XCircleIcon;
  const iconColor = state.complete
    ? "text-green-600 dark:text-green-400"
    : "text-grey-medium dark:text-gray-500";

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200">
          Company profile completion
        </h3>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/employer/settings">
            {state.complete ? "View" : "Complete"}
          </Link>
        </Button>
      </div>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          {state.name ? (
            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
          ) : (
            <XCircleIcon className={`h-5 w-5 shrink-0 ${iconColor}`} />
          )}
          <span className={state.name ? "text-grey-dark dark:text-gray-200" : "text-grey-medium dark:text-gray-400"}>
            Company name {state.name ? "complete" : "missing"}
          </span>
        </li>
        <li className="flex items-center gap-2">
          {state.industry ? (
            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
          ) : (
            <XCircleIcon className={`h-5 w-5 shrink-0 ${iconColor}`} />
          )}
          <span className={state.industry ? "text-grey-dark dark:text-gray-200" : "text-grey-medium dark:text-gray-400"}>
            Industry {state.industry ? "set" : "not set"}
          </span>
        </li>
        <li className="flex items-center gap-2">
          {state.location ? (
            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
          ) : (
            <XCircleIcon className={`h-5 w-5 shrink-0 ${iconColor}`} />
          )}
          <span className={state.location ? "text-grey-dark dark:text-gray-200" : "text-grey-medium dark:text-gray-400"}>
            Location {state.location ? "set" : "not set (optional)"}
          </span>
        </li>
        <li className="flex items-center gap-2">
          {state.verification ? (
            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
          ) : (
            <XCircleIcon className={`h-5 w-5 shrink-0 ${iconColor}`} />
          )}
          <span className={state.verification ? "text-grey-dark dark:text-gray-200" : "text-grey-medium dark:text-gray-400"}>
            Verification {state.verification ? "verified" : "pending"}
          </span>
        </li>
      </ul>
      {!state.complete && (
        <p className="mt-3 text-xs text-grey-medium dark:text-gray-400">
          Complete your profile in Settings to unlock the best experience for candidates and search.
        </p>
      )}
    </Card>
  );
}
