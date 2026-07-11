"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WvInput, WvButton, WvCard } from "@/components/wv";

export function CreateLocationForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/enterprise/organizations/${orgId}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to create location");
        setLoading(false);
        return;
      }
      router.push(`/enterprise/${orgId}`);
      router.refresh();
    } catch {
      setError("Request failed");
      setLoading(false);
    }
  };

  return (
    <WvCard>
      <form onSubmit={handleSubmit} className="space-y-4">
        <WvInput
          label="Name"
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Downtown Office"
        />
        <WvInput
          label="Slug (optional)"
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="downtown-office"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <WvButton type="submit" disabled={loading} className="w-full">
          {loading ? "Creating…" : "Create location"}
        </WvButton>
      </form>
    </WvCard>
  );
}
