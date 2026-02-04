"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const HEALTHCARE_SETTINGS = [
  "Hospital",
  "Nursing Home",
  "Assisted Living",
  "Home Health Agency",
  "Dental Office",
  "Clinic / Outpatient",
  "Rehab Center",
  "Lab / Diagnostics",
];

export function HealthcareSettingClient() {
  const router = useRouter();
  // Using single supabase instance
  const [setting, setSetting] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      console.log("Supabase auth check triggered in: app/(app)/onboarding/healthcare/setting/healthcare-setting-client.tsx");
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);
    }

    checkUser();
  }, [router, supabase]);

  const handleNext = async () => {
    if (!setting) {
      alert("Please select a work setting");
      return;
    }

    setLoading(true);

    try {
      const supabaseAny = supabase as any;
      const { error } = await supabaseAny
        .from("healthcare_profiles")
        .update({ work_setting: setting })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error saving work setting:", error);
        alert("Error saving setting. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/onboarding/healthcare/job");
    } catch (err: any) {
      console.error("Error:", err);
      alert("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-grey-medium dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <Card className="p-8">
      <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
        Where do you usually work?
      </h1>
      <p className="text-grey-medium dark:text-gray-400 mb-6">
        Select your primary work setting
      </p>

      <div className="mb-6">
        <Label htmlFor="setting" className="mb-2 block">
          Work Setting *
        </Label>
        <select
          id="setting"
          value={setting}
          onChange={(e) => setSetting(e.target.value)}
          className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        >
          <option value="">-- Select Setting --</option>
          {HEALTHCARE_SETTINGS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <Button
        onClick={handleNext}
        disabled={!setting || loading}
        className="w-full"
      >
        {loading ? "Saving..." : "Next"}
      </Button>
    </Card>
  );
}
