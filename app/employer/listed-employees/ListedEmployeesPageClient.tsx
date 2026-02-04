"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

export function ListedEmployeesPageClient({ employerId, planTier }: ListedEmployeesPageClientProps) {
  const [employees, setEmployees] = useState<ListedEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employer/listed-employees", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.employees)) setEmployees(data.employees);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-grey-medium dark:text-gray-400">Loading employees…</p>
      </Card>
    );
  }

  if (employees.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-grey-medium dark:text-gray-400">No employees have listed your company yet.</p>
        <p className="text-sm text-grey-medium dark:text-gray-500 mt-2">When they add your company to their work history, they will appear here.</p>
        <Link href="/employer/dashboard">
          <Button variant="secondary" className="mt-4">Back to Dashboard</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-grey-background dark:border-[#374151] bg-grey-background/50 dark:bg-[#1A1F2B]">
            <tr>
              <th className="p-3 font-semibold text-grey-dark dark:text-gray-200">Name</th>
              <th className="p-3 font-semibold text-grey-dark dark:text-gray-200">Job title</th>
              <th className="p-3 font-semibold text-grey-dark dark:text-gray-200">Dates</th>
              <th className="p-3 font-semibold text-grey-dark dark:text-gray-200">Status</th>
              {planTier !== "free" && <th className="p-3 font-semibold text-grey-dark dark:text-gray-200">Refs</th>}
              {(planTier === "pro" || planTier === "enterprise") && <th className="p-3 font-semibold text-grey-dark dark:text-gray-200">Profile</th>}
              <th className="p-3 font-semibold text-grey-dark dark:text-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.record_id} className="border-b border-grey-background/50 dark:border-[#374151]/50">
                <td className="p-3 text-grey-dark dark:text-gray-200">{emp.name}</td>
                <td className="p-3 text-grey-medium dark:text-gray-400">{emp.job_title}</td>
                <td className="p-3 text-grey-medium dark:text-gray-400">
                  {emp.start_date} – {emp.end_date ?? "Present"}
                </td>
                <td className="p-3">
                  <span
                    className={
                      emp.verification_status === "verified" || emp.verification_status === "matched"
                        ? "text-green-600 dark:text-green-400"
                        : emp.verification_status === "flagged"
                          ? "text-red-600 dark:text-red-400"
                          : "text-amber-600 dark:text-amber-400"
                    }
                  >
                    {emp.verification_status}
                  </span>
                </td>
                {planTier !== "free" && <td className="p-3 text-grey-medium dark:text-gray-400">{emp.reference_count ?? "—"}</td>}
                {(planTier === "pro" || planTier === "enterprise") && (
                  <td className="p-3 text-grey-medium dark:text-gray-400">{emp.profile_strength != null ? `${emp.profile_strength}%` : "—"}</td>
                )}
                <td className="p-3">
                  <Link href={`/employer/candidates/${emp.user_id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-grey-background dark:border-[#374151]">
        <Link href="/employer/dashboard">
          <Button variant="ghost" size="sm">Back to Dashboard</Button>
        </Link>
      </div>
    </Card>
  );
}
