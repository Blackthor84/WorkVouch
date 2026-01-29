"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function HealthcareCoworkersClient() {
  const router = useRouter();
  // Using single supabase instance
  const [coworkers, setCoworkers] = useState<
    Array<{ id?: string; coworker_name: string }>
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push("/auth/signin");
        return;
      }

      setUser(currentUser);
      fetchCoworkers(currentUser.id);
    }

    checkUser();
  }, [router, supabase]);

  const fetchCoworkers = async (userId: string) => {
    try {
      const supabaseAny = supabase as any;
      const { data, error } = await supabaseAny
        .from("coworker_matches")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching coworkers:", error);
        return;
      }

      setCoworkers(data || []);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleAdd = async () => {
    if (!input.trim()) return;

    if (!user) return;

    setLoading(true);

    try {
      const supabaseAny = supabase as any;
      const { data, error } = await supabaseAny
        .from("coworker_matches")
        .insert([
          {
            user_id: user.id,
            coworker_name: input.trim(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error adding coworker:", error);
        alert("Error adding coworker. Please try again.");
        setLoading(false);
        return;
      }

      setCoworkers((prev) => [...prev, data]);
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

    try {
      const supabaseAny = supabase as any;
      const { error } = await supabaseAny
        .from("coworker_matches")
        .delete()
        .eq("user_id", user.id)
        .eq("coworker_name", coworkerName);

      if (error) {
        console.error("Error removing coworker:", error);
        return;
      }

      setCoworkers((prev) =>
        prev.filter((c) => c.coworker_name !== coworkerName),
      );
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleComplete = () => {
    router.push("/dashboard");
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
        Add Your Healthcare Coworkers
      </h1>
      <p className="text-grey-medium dark:text-gray-400 mb-6">
        Add coworkers who can verify your work experience. You can also invite
        coworkers by email if they're not on WorkVouch yet.
      </p>

      <div className="space-y-4 mb-6">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Coworker Name"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            className="flex-1"
          />
          <Button onClick={handleAdd} disabled={!input.trim() || loading}>
            Add
          </Button>
        </div>

        {coworkers.length > 0 && (
          <div className="space-y-2">
            <Label>Added Coworkers:</Label>
            {coworkers.map((c, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1A1F2B] rounded-lg"
              >
                <span className="text-grey-dark dark:text-gray-200">
                  {c.coworker_name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(c.coworker_name)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button onClick={handleComplete} className="w-full">
        Complete Onboarding
      </Button>
    </Card>
  );
}
