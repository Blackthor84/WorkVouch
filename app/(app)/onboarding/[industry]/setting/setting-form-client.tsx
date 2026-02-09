"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  SETTING_OPTIONS,
  ONBOARDING_DISPLAY_NAMES,
  type OnboardingIndustry,
} from "@/lib/constants/industries";

interface SettingFormClientProps {
  industry: OnboardingIndustry;
}

export function SettingFormClient({ industry }: SettingFormClientProps) {
  const router = useRouter();
  // Using single supabase instance
  const [setting, setSetting] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      console.log("Supabase auth check triggered in: app/(app)/onboarding/[industry]/setting/setting-form-client.tsx");
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
      const tableName = `${industry}_profiles`;
      const supabaseAny = supabase as any;

      const { error } = await supabaseAny
        .from(tableName)
        .update({ work_setting: setting })
        .eq("user_id", user.id);

      if (error) {
        console.error(`Error saving ${industry} setting:`, error);
        alert("Error saving setting. Please try again.");
        setLoading(false);
        return;
      }

      router.push(`/onboarding/${industry}/job`);
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

  const settings = SETTING_OPTIONS[industry] || [];
  const industryName = ONBOARDING_DISPLAY_NAMES[industry] || industry;

  return (
    <Card className="p-8">
      <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
        Where Do You Work?
      </h1>
      <p className="text-grey-medium dark:text-gray-400 mb-6">
        Select your primary work setting in {industryName}
      </p>

      <div className="space-y-3 mb-6">
        {settings.map((s) => (
          <button
            key={s}
            onClick={() => setSetting(s)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              setting === s
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 hover:border-primary/50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => router.push(`/onboarding/${industry}/role`)}
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={loading || !setting}
          className="flex-1"
        >
          {loading ? "Saving..." : "Next"}
        </Button>
      </div>
    </Card>
  );
}
