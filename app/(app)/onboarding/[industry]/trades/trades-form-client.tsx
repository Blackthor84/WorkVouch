"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Trade {
  id: string;
  slug: string;
  display_name: string;
}

interface TradesFormClientProps {
  industry: string;
}

export function TradesFormClient({ industry }: TradesFormClientProps) {
  const router = useRouter();
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [listRes, profileRes] = await Promise.all([
          fetch("/api/trades"),
          fetch("/api/profile/trades"),
        ]);
        const listData = await listRes.json();
        const profileData = await profileRes.json();
        if (listData.trades) setAllTrades(listData.trades);
        if (profileData.trades?.length) {
          setSelectedSlugs(
            new Set(profileData.trades.map((t: { slug: string }) => t.slug).filter(Boolean))
          );
        }
      } catch (e) {
        console.error("Load trades:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggle = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/trades", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade_slugs: Array.from(selectedSlugs) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to save skilled trades");
        setSaving(false);
        return;
      }
      router.push(`/onboarding/${industry}/job`);
    } catch (e) {
      console.error(e);
      alert("An error occurred. Please try again.");
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.push(`/onboarding/${industry}/job`);
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-8">Loading trades...</div>
    );
  }

  return (
    <Card className="p-8">
      <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
        Your Skilled Trades
      </h1>
      <p className="text-grey-medium dark:text-gray-400 mb-6">
        Select one or more skilled trades that match your experience. Employers can filter by skilled trade.
      </p>

      <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
        {allTrades.map((t) => (
          <label
            key={t.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-grey-background dark:border-[#374151] hover:border-primary/50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedSlugs.has(t.slug)}
              onChange={() => toggle(t.slug)}
              className="rounded border-gray-300"
            />
            <span className="text-grey-dark dark:text-gray-200">{t.display_name}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => router.push(`/onboarding/${industry}/setting`)}
        >
          Back
        </Button>
        <Button variant="ghost" onClick={handleSkip} disabled={saving}>
          Skip
        </Button>
        <Button
          onClick={handleNext}
          disabled={saving}
          className="flex-1"
        >
          {saving ? "Saving..." : "Next"}
        </Button>
      </div>
    </Card>
  );
}
