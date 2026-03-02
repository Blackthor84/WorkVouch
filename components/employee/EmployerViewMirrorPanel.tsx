"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Section 1 — Employer View Mirror (primary).
 * Opens the same employer profile view and payload employers use; no employee-only logic.
 */
export function EmployerViewMirrorPanel() {
  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Employer View Mirror
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This is exactly what employers see when evaluating your profile.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/profile/employer-view">View My Profile as an Employer</Link>
        </Button>
      </div>
    </Card>
  );
}
