"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ClaimRequest {
  id: string;
  employer_id: string;
  requested_by_user_id: string;
  status: string;
  created_at: string;
  company_name?: string;
  requester_name?: string;
  requester_email?: string;
}

export function ClaimRequestsClient() {
  const [items, setItems] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("pending");

  const fetchList = () => {
    fetch(`/api/admin/claim-requests?status=${statusFilter}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.claim_requests)) setItems(data.claim_requests);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchList();
  }, [statusFilter]);

  const approve = async (id: string) => {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/claim-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
        credentials: "include",
      });
      if (res.ok) fetchList();
    } finally {
      setActing(null);
    }
  };

  const reject = async (id: string) => {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/claim-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
        credentials: "include",
      });
      if (res.ok) fetchList();
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-grey-medium dark:text-gray-400">Loading…</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-3 border-b border-grey-background dark:border-[#374151] flex gap-2">
        <Button variant={statusFilter === "pending" ? "primary" : "ghost"} size="sm" onClick={() => setStatusFilter("pending")}>
          Pending
        </Button>
        <Button variant={statusFilter === "all" ? "primary" : "ghost"} size="sm" onClick={() => setStatusFilter("all")}>
          All
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-grey-background dark:border-[#374151] bg-grey-background/50 dark:bg-[#1A1F2B]">
            <tr>
              <th className="p-3 font-semibold text-grey-dark dark:text-gray-200">Company</th>
              <th className="p-3 font-semibold text-grey-dark dark:text-gray-200">Requester</th>
              <th className="p-3 font-semibold text-grey-dark dark:text-gray-200">Status</th>
              <th className="p-3 font-semibold text-grey-dark dark:text-gray-200">Date</th>
              <th className="p-3 font-semibold text-grey-dark dark:text-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-grey-medium dark:text-gray-400">
                  No claim requests
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="border-b border-grey-background/50 dark:border-[#374151]/50">
                  <td className="p-3 text-grey-dark dark:text-gray-200">{r.company_name ?? r.employer_id}</td>
                  <td className="p-3 text-grey-dark dark:text-gray-200">
                    {r.requester_name ?? "—"} {r.requester_email && <span className="text-xs text-grey-medium">({r.requester_email})</span>}
                  </td>
                  <td className="p-3">
                    <span className={r.status === "pending" ? "text-amber-600" : r.status === "approved" ? "text-green-600" : "text-red-600"}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-grey-medium dark:text-gray-400">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" className="mr-1" disabled={acting === r.id} onClick={() => approve(r.id)}>
                          {acting === r.id ? "…" : "Approve"}
                        </Button>
                        <Button size="sm" variant="secondary" disabled={acting === r.id} onClick={() => reject(r.id)}>
                          Reject
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
