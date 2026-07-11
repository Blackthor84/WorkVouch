"use client";

import { useState, useEffect } from "react";
import { WvCard, WvButton, WvBadge } from "@/components/wv";

interface ListedEmployee {
  record_id: string;
  user_id: string;
  name: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  verification_status: string;
  created_at: string;
  reference_count?: number;
  profile_strength?: number;
}

interface ListedEmployeesPageClientProps {
  employerId: string;
  planTier: string;
}

function statusVariant(status: string): "success" | "warning" | "danger" | "default" {
  if (status === "verified" || status === "matched") return "success";
  if (status === "flagged") return "danger";
  return "warning";
}

export function ListedEmployeesPageClient({ employerId, planTier }: ListedEmployeesPageClientProps) {
  const [employees, setEmployees] = useState<ListedEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const refetch = () => {
    fetch("/api/employer/listed-employees", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.employees)) setEmployees(data.employees);
      })
      .catch((error) => {
        console.error("[SYSTEM_FAIL]", error);
      });
  };

  useEffect(() => {
    refetch();
    setLoading(false);
  }, []);

  const confirmEmployment = async (recordId: string) => {
    setActing(recordId);
    try {
      const res = await fetch("/api/employer/confirm-employment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record_id: recordId }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) refetch();
      else if (!res.ok) alert(data.error ?? "Failed to confirm");
    } finally {
      setActing(null);
    }
  };

  const disputeEmployment = async (recordId: string) => {
    if (!confirm("Dispute this employment? The record will be marked as flagged.")) return;
    setActing(recordId);
    try {
      const res = await fetch("/api/employer/dispute-employment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record_id: recordId }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) refetch();
      else if (!res.ok) alert(data.error ?? "Failed to dispute");
    } finally {
      setActing(null);
    }
  };

  const requestVerification = async (recordId: string) => {
    setActing(recordId);
    try {
      const res = await fetch("/api/employer/request-employment-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record_id: recordId }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) refetch();
      else if (!res.ok) alert(data.error ?? "Failed to request verification");
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <WvCard className="p-8 text-center">
        <p className="text-wv-muted">Loading employees…</p>
      </WvCard>
    );
  }

  if (employees.length === 0) {
    return (
      <WvCard className="p-8 text-center">
        <p className="text-wv-muted">No former workers listed yet.</p>
        <p className="text-sm text-wv-muted/80 mt-2">
          Only past employment is shown here. When someone adds your company as a previous employer (not their current
          job), they will appear in this list.
        </p>
        <WvButton href="/employer/dashboard" variant="secondary" className="mt-4">
          Back to Dashboard
        </WvButton>
      </WvCard>
    );
  }

  return (
    <WvCard padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-wv-border bg-wv-surface/80">
            <tr>
              <th className="p-3 font-semibold text-wv-foreground">Name</th>
              <th className="p-3 font-semibold text-wv-foreground">Job title</th>
              <th className="p-3 font-semibold text-wv-foreground">Dates</th>
              <th className="p-3 font-semibold text-wv-foreground">Status</th>
              {planTier !== "free" && <th className="p-3 font-semibold text-wv-foreground">Refs</th>}
              {(planTier === "pro" || planTier === "custom") && (
                <th className="p-3 font-semibold text-wv-foreground">Profile</th>
              )}
              <th className="p-3 font-semibold text-wv-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.record_id} className="border-b border-wv-border/50">
                <td className="p-3 text-wv-foreground">{emp.name}</td>
                <td className="p-3 text-wv-muted">{emp.job_title}</td>
                <td className="p-3 text-wv-muted">
                  {emp.start_date} – {emp.end_date ?? "Present"}
                </td>
                <td className="p-3">
                  <WvBadge variant={statusVariant(emp.verification_status)}>{emp.verification_status}</WvBadge>
                </td>
                {planTier !== "free" && <td className="p-3 text-wv-muted">{emp.reference_count ?? "—"}</td>}
                {(planTier === "pro" || planTier === "custom") && (
                  <td className="p-3 text-wv-muted">
                    {emp.profile_strength != null ? `${emp.profile_strength}%` : "—"}
                  </td>
                )}
                <td className="p-3 flex flex-wrap gap-1">
                  <WvButton href={`/employer/candidates/${emp.user_id}`} variant="ghost" size="sm">
                    View
                  </WvButton>
                  {(emp.verification_status === "pending" || emp.verification_status === "matched") && (
                    <WvButton
                      variant="secondary"
                      size="sm"
                      disabled={acting === emp.record_id}
                      onClick={() => confirmEmployment(emp.record_id)}
                    >
                      {acting === emp.record_id ? "…" : "Confirm"}
                    </WvButton>
                  )}
                  {(emp.verification_status === "pending" || emp.verification_status === "matched") && (
                    <WvButton
                      variant="secondary"
                      size="sm"
                      disabled={acting === emp.record_id}
                      onClick={() => requestVerification(emp.record_id)}
                    >
                      Request verify
                    </WvButton>
                  )}
                  {(emp.verification_status === "pending" ||
                    emp.verification_status === "matched" ||
                    emp.verification_status === "verified") && (
                    <WvButton
                      variant="danger"
                      size="sm"
                      disabled={acting === emp.record_id}
                      onClick={() => disputeEmployment(emp.record_id)}
                    >
                      Dispute
                    </WvButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-wv-border">
        <WvButton href="/employer/dashboard" variant="ghost" size="sm">
          Back to Dashboard
        </WvButton>
      </div>
    </WvCard>
  );
}
