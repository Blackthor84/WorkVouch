"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const HEALTHCARE_ROLES = [
  "CNA",
  "HHA",
  "Medical Assistant",
  "Patient Care Tech",
  "Dental Assistant",
  "Medical Receptionist",
  "Phlebotomist",
  "Pharmacy Technician",
  "ER Tech",
  "Caregiver",
  "Lab Assistant",
  "Sterile Processing Tech",
];

export function HealthcareRoleClient() {
  const router = useRouter();
  // Using single supabase instance
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      console.log("Supabase auth check triggered in: app/(app)/onboarding/healthcare/role/healthcare-role-client.tsx");
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push("/login");
        return;
      }

      // Check if user's industry is healthcare
      const supabaseAny = supabase as any;
      const { data: profile } = await supabaseAny
        .from("profiles")
        .select("industry")
        .eq("id", currentUser.id)
        .single();

      type ProfileRow = { industry: string | null };
      const profileTyped = profile as ProfileRow | null;

      if (profileTyped?.industry !== "healthcare") {
        router.push("/dashboard");
        return;
      }

      setUser(currentUser);
    }

    checkUser();
  }, [router, supabase]);

  const handleNext = async () => {
    if (!role) {
      alert("Please select a role");
      return;
    }

    setLoading(true);

    try {
      // Create or update healthcare profile
      const supabaseAny = supabase as any;
      const { error } = await supabaseAny.from("healthcare_profiles").upsert(
        {
          user_id: user.id,
          role,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      );

      if (error) {
        console.error("Error saving healthcare role:", error);
        alert("Error saving role. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/onboarding/healthcare/setting");
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
        What type of healthcare worker are you?
      </h1>
      <p className="text-grey-medium dark:text-gray-400 mb-6">
        Select your primary healthcare role
      </p>

      <div className="space-y-2 mb-6">
        {HEALTHCARE_ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`w-full border-2 rounded-xl py-3 px-4 text-left transition-all ${
              role === r
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-gray-300 dark:border-[#374151] bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 hover:border-blue-500"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <Button
        onClick={handleNext}
        disabled={!role || loading}
        className="w-full"
      >
        {loading ? "Saving..." : "Next"}
      </Button>
    </Card>
  );
}
