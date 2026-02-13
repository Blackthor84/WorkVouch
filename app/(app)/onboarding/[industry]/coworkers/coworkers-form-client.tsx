"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ONBOARDING_DISPLAY_NAMES,
  type OnboardingIndustry,
} from "@/lib/constants/industries";

interface CoworkersFormClientProps {
  industry: OnboardingIndustry;
}

export function CoworkersFormClient({ industry }: CoworkersFormClientProps) {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [coworkers, setCoworkers] = useState<
    Array<{ id?: number; coworker_name: string }>
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const fetchCoworkers = async (userId: string) => {
    const { data, error } = await (supabase as any)
      .from("coworker_matches")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching coworkers:", error);
      return;
    }

    setCoworkers(data || []);
  };

  useEffect(() => {
    (async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
      fetchCoworkers(currentUser.id);
    })();
  }, [router]);

  const handleAdd = async () => {
    if (!input.trim()) {
      alert("Please enter a coworker name");
      return;
    }

    if (!user) return;

    setLoading(true);

    try {
      const { error } = await (supabase as any).from("coworker_matches").insert([
        {
          user_id: user.id,
          coworker_name: input.trim(),
        },
      ]);

      if (error) {
        console.error("Error adding coworker:", error);
        alert("Error adding coworker. Please try again.");
        setLoading(false);
        return;
      }

      setCoworkers([...coworkers, { coworker_name: input.trim() }]);
      setInput("");
    } catch (err: any) {
      console.error("Error:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (coworkerName: string) => {
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await (supabase as any)
        .from("coworker_matches")
        .delete()
        .eq("user_id", user.id)
        .eq("coworker_name", coworkerName);

      if (error) {
        console.error("Error removing coworker:", error);
        alert("Error removing coworker. Please try again.");
        setLoading(false);
        return;
      }

      setCoworkers(coworkers.filter((c) => c.coworker_name !== coworkerName));
    } catch (err: any) {
      console.error("Error:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    router.push("/dashboard");
  };

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-grey-medium dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const industryName = ONBOARDING_DISPLAY_NAMES[industry] || industry;

  return (
    <Card className="p-8">
      <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
        Add Your {industryName} Coworkers
      </h1>
      <p className="text-grey-medium dark:text-gray-400 mb-6">
        Add coworkers who can verify your work experience. You can also invite
        coworkers by email if they're not on WorkVouch yet.
      </p>

      <div className="space-y-4 mb-6">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="coworkerName">Coworker Name</Label>
            <Input
              id="coworkerName"
              type="text"
              placeholder="Enter coworker's full name"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdd} disabled={loading || !input.trim()}>
              Add
            </Button>
          </div>
        </div>

        {coworkers.length > 0 && (
          <div className="space-y-2">
            <Label>Added Coworkers ({coworkers.length})</Label>
            <div className="space-y-2">
              {coworkers.map((coworker, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-grey-background dark:bg-[#111827] rounded-lg"
                >
                  <span className="text-grey-dark dark:text-gray-200">
                    {coworker.coworker_name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(coworker.coworker_name)}
                    disabled={loading}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => router.push(`/onboarding/${industry}/job`)}
        >
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1">
          Complete Onboarding
        </Button>
      </div>
    </Card>
  );
}
