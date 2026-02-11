"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

export function EditCompanyInfo() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employer, setEmployer] = useState<{ companyName: string; contactEmail: string | null } | null>(null);
  const [form, setForm] = useState({ company_name: "", contact_email: "" });

  const fetchEmployer = async () => {
    setFetchLoading(true);
    try {
      const res = await fetch("/api/employer/me");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEmployer(null);
        return;
      }
      const emp = data.employer;
      setEmployer({
        companyName: emp?.companyName ?? "",
        contactEmail: emp?.contactEmail ?? null,
      });
      setForm({
        company_name: emp?.companyName ?? "",
        contact_email: emp?.contactEmail ?? "",
      });
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployer();
  }, []);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && employer) {
      setForm({ company_name: employer.companyName, contact_email: employer.contactEmail ?? "" });
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/employer/update-company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.company_name.trim(),
          contact_email: form.contact_email.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Update failed");
        return;
      }
      setOpen(false);
      fetchEmployer();
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return null;

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => handleOpen(true)}>
        <PencilSquareIcon className="h-4 w-4 mr-2" />
        Edit Company Info
      </Button>
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company Info</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-300 mb-1">Company name</label>
              <input
                type="text"
                required
                minLength={2}
                className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
                value={form.company_name}
                onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-300 mb-1">Contact email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
                value={form.contact_email}
                onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
              />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
