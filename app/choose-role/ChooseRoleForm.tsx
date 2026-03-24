"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";

export function ChooseRoleForm() {
  const [loading, setLoading] = useState<"employee" | "employer" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setRole(role: "employee" | "employer") {
    setError(null);
    setLoading(role);
    try {
      const res = await fetch("/api/user/choose-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save your choice.");
        setLoading(null);
        return;
      }
      const savedRole = typeof (data as { role?: string }).role === "string" ? (data as { role: string }).role : role;
      console.log("USER ROLE:", savedRole);
      const nextPath = role === "employer" ? "/enterprise" : "/dashboard";
      window.location.assign(nextPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-8 items-center justify-center min-h-screen px-4 py-12">
      <div className="text-center space-y-2 max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">How will you use WorkVouch?</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Choose once — we&apos;ll show the right dashboard and tools.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
        <Button
          size="lg"
          variant="outline"
          className="flex-1 flex flex-col items-center gap-3 h-auto py-8 border-2"
          onClick={() => setRole("employee")}
          disabled={loading !== null}
        >
          <BriefcaseIcon className="h-10 w-10 text-blue-600" aria-hidden />
          <span className="font-semibold">Employee</span>
          <span className="text-xs text-muted-foreground font-normal text-center px-2">
            Build your trust profile and get verified by coworkers
          </span>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1 flex flex-col items-center gap-3 h-auto py-8 border-2"
          onClick={() => setRole("employer")}
          disabled={loading !== null}
        >
          <BuildingOffice2Icon className="h-10 w-10 text-emerald-600" aria-hidden />
          <span className="font-semibold">Employer</span>
          <span className="text-xs text-muted-foreground font-normal text-center px-2">
            Hire smarter using verified work history and trust insights
          </span>
        </Button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Setting up your account…</p>}
    </div>
  );
}
