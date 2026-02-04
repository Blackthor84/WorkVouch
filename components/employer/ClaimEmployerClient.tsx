"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Company {
  id: string;
  company_name: string;
}

export function ClaimEmployerClient() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/employer/companies-to-claim", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.companies)) setCompanies(data.companies);
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    if (!selectedId) {
      setMessage({ type: "error", text: "Select a company" });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/employer/claim-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employer_id: selectedId }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: "Claim request submitted. An admin will review it shortly." });
        setSelectedId("");
      } else {
        setMessage({ type: "error", text: data.error ?? "Failed to submit request" });
      }
    } catch {
      setMessage({ type: "error", text: "Request failed" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-grey-medium dark:text-gray-400">Loading companies…</p>
      </Card>
    );
  }

  if (companies.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-grey-medium dark:text-gray-400">No unclaimed companies available to claim right now.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Company</label>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full rounded border border-grey-background dark:border-[#374151] bg-white dark:bg-[#0D1117] px-3 py-2 text-grey-dark dark:text-gray-200 mb-4"
      >
        <option value="">Select a company</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.company_name}
          </option>
        ))}
      </select>
      <Button onClick={submit} disabled={submitting || !selectedId}>
        {submitting ? "Submitting…" : "Submit claim request"}
      </Button>
      {message && (
        <p className={`mt-4 text-sm ${message.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {message.text}
        </p>
      )}
    </Card>
  );
}
