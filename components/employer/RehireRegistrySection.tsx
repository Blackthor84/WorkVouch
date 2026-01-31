"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

export interface RehireEntry {
  id: string;
  profile_id: string;
  full_name: string;
  rehire_eligible: boolean;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface RehireRegistrySectionProps {
  entries: RehireEntry[];
  onRefresh: () => void;
}

export function RehireRegistrySection({ entries, onRefresh }: RehireRegistrySectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rehireEligible, setRehireEligible] = useState(true);
  const [internalNotes, setInternalNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const entry = editingId ? entries.find((e) => e.id === editingId) : null;

  const openEdit = (e: RehireEntry) => {
    setEditingId(e.id);
    setRehireEligible(e.rehire_eligible);
    setInternalNotes(e.internal_notes ?? "");
  };

  const closeEdit = () => {
    setEditingId(null);
    setRehireEligible(true);
    setInternalNotes("");
  };

  const saveEdit = async () => {
    if (!entry) return;
    setSaving(true);
    try {
      const res = await fetch("/api/employer/rehire", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: entry.profile_id,
          rehireEligible,
          internalNotes: internalNotes.trim() || undefined,
        }),
        credentials: "include",
      });
      if (res.ok) {
        closeEdit();
        onRefresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
        Rehire Registry
      </h2>
      {entries.length === 0 ? (
        <p className="text-sm text-grey-medium dark:text-gray-400">No rehire entries yet.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-grey-background dark:bg-[#1A1F2B]"
            >
              <span className="font-medium text-grey-dark dark:text-gray-200">{e.full_name}</span>
              <Badge variant={e.rehire_eligible ? "success" : "secondary"}>
                {e.rehire_eligible ? "Rehire Eligible" : "Not Eligible"}
              </Badge>
              {e.internal_notes && (
                <span className="text-sm text-grey-medium dark:text-gray-400 truncate max-w-xs">
                  {e.internal_notes}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEdit(e)}
                className="ml-auto"
                aria-label="Edit rehire"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {entry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rehire-edit-title"
        >
          <div className="bg-white dark:bg-[#1A1F2B] rounded-xl p-6 max-w-md w-full mx-4 shadow-xl border border-grey-background dark:border-[#374151]">
            <h3 id="rehire-edit-title" className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
              Edit rehire — {entry.full_name}
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rehireEligible}
                  onChange={(ev) => setRehireEligible(ev.target.checked)}
                  className="rounded border-grey-medium"
                />
                <span className="text-sm text-grey-dark dark:text-gray-200">Rehire eligible</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-1">
                  Internal notes
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(ev) => setInternalNotes(ev.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#0D1117] px-3 py-2 text-sm text-grey-dark dark:text-gray-200"
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <Button variant="secondary" onClick={closeEdit} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
