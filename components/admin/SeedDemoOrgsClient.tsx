"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SeedDemoOrgsClient() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/seed-demo-orgs", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "ok", text: data.message ?? `Created ${data.created ?? 0} demo orgs.` });
      } else {
        setMessage({ type: "err", text: data.error ?? "Failed" });
      }
    } catch {
      setMessage({ type: "err", text: "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleSeed} disabled={loading}>
        {loading ? "Seeding…" : "Seed demo orgs"}
      </Button>
      {message && (
        <p className={message.type === "ok" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
