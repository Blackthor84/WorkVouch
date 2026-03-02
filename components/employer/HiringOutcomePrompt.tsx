"use client";

import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface HiringOutcomePromptProps {
  candidateId: string;
}

export function HiringOutcomePrompt({ candidateId }: HiringOutcomePromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hired, setHired] = useState<boolean | null>(null);
  const [wouldRehire, setWouldRehire] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/employer/candidate/${candidateId}/hiring-outcome-status`
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data.showPrompt === true) setShowPrompt(true);
      } catch {
        // Silent: do not show prompt on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  const submit = async (dismissed: boolean) => {
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/employer/candidate/${candidateId}/hiring-outcome`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            dismissed
              ? { dismissed: true }
              : { hired: hired ?? undefined, would_rehire: wouldRehire ?? undefined }
          ),
        }
      );
      if (res.ok) setShowPrompt(false);
    } catch {
      // Silent
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => submit(true);
  const handleSubmit = () => submit(false);

  if (loading || !showPrompt) return null;

  return (
    <Card className="p-6 border-dashed border-grey-background dark:border-[#374151]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-grey-dark dark:text-gray-200 mb-1">
            Hiring Outcome (Optional)
          </h3>
          <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
            Your feedback helps improve trust signals across the platform. Responses are private and never shown publicly.
          </p>
          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <span className="text-xs text-grey-medium dark:text-gray-400 block mb-1">Hired / Not Hired</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={hired === true ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setHired(true)}
                >
                  Hired
                </Button>
                <Button
                  type="button"
                  variant={hired === false ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setHired(false)}
                >
                  Not Hired
                </Button>
              </div>
            </div>
            <div>
              <span className="text-xs text-grey-medium dark:text-gray-400 block mb-1">Would you rehire this candidate? Yes / No</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={wouldRehire === true ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setWouldRehire(true)}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={wouldRehire === false ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setWouldRehire(false)}
                >
                  No
                </Button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
            >
              Submit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              disabled={submitting}
            >
              Dismiss
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={submitting}
          className="p-1 rounded text-grey-medium hover:text-grey-dark dark:hover:text-gray-200"
          aria-label="Dismiss"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
}
