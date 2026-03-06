"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserGroupIcon } from "@heroicons/react/24/outline";

type Props = {
  employmentRecordId: string;
  coworkerIds: string[];
  companyName: string;
  onSuccess?: () => void;
};

const MAX_BULK = 10;

export function BulkVerificationButton({
  employmentRecordId,
  coworkerIds,
  companyName,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ids = coworkerIds.slice(0, MAX_BULK);
  const disabled = ids.length === 0;

  const handleBulk = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/verification/bulk-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ employment_record_id: employmentRecordId, coworker_ids: ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to send requests");
        return;
      }
      const created = (data as { created?: number }).created ?? 0;
      if (created > 0) onSuccess?.();
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled || loading}
        onClick={handleBulk}
        className="w-full sm:w-auto"
      >
        <UserGroupIcon className="h-4 w-4 mr-2" />
        {loading ? "Sending…" : `Verify everyone from this job (up to ${ids.length})`}
      </Button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
