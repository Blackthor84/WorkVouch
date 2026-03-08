"use client";

import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";

export default function ChooseRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<"employee" | "employer" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setRole(role: "employee" | "employer") {
    setError(null);
    setLoading(role);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user?.id) {
        setError("Not signed in.");
        setLoading(null);
        return;
      }
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", authData.user.id);
      if (updateError) {
        setError(updateError.message);
        setLoading(null);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-8 items-center justify-center min-h-[60vh] px-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          How will you use WorkVouch?
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose your role to get the right dashboard and tools.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Button
          size="lg"
          variant="outline"
          className="flex-1 flex flex-col items-center gap-3 h-auto py-8"
          onClick={() => setRole("employee")}
          disabled={loading !== null}
        >
          <BriefcaseIcon className="h-10 w-10 text-blue-600" />
          <span className="font-semibold">I&apos;m an Employee</span>
          <span className="text-xs text-muted-foreground font-normal">
            Verify my job history, get references, build my profile
          </span>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1 flex flex-col items-center gap-3 h-auto py-8"
          onClick={() => setRole("employer")}
          disabled={loading !== null}
        >
          <BuildingOffice2Icon className="h-10 w-10 text-emerald-600" />
          <span className="font-semibold">I&apos;m an Employer</span>
          <span className="text-xs text-muted-foreground font-normal">
            Search candidates, verify work history, hire with confidence
          </span>
        </Button>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {loading && (
        <p className="text-sm text-gray-500">Setting up your account...</p>
      )}
    </div>
  );
}
