"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

export function EmployerNotesPanel({ candidateId }: { candidateId: string }) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    const url = "/api/employer/candidate/" + encodeURIComponent(candidateId) + "/notes";
    fetch(url, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load notes");
        return res.json();
      })
      .then((data: { notes?: string }) => {
        if (!cancelled) {
          const n = typeof data.notes === "string" ? data.notes : "";
          setNotes(n);
          setDraft(n);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  const saveNotes = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/employer/candidate/" + encodeURIComponent(candidateId) + "/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notes: draft }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setNotes(draft);
      setEditMode(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Employer notes</h2>
        <div className="h-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Employer notes</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Private notes for your team. Not visible to the candidate.
      </p>
      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>}
      {editMode ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
            placeholder="Add notes..."
          />
          <div className="flex gap-2">
            <Button onClick={saveNotes} disabled={saving} size="sm">
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setDraft(notes); setEditMode(false); setError(null); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap min-h-[4rem]">
            {notes || "No notes yet."}
          </p>
          <Button variant="ghost" size="sm" className="mt-2 inline-flex items-center gap-1" onClick={() => setEditMode(true)}>
            <PencilSquareIcon className="h-4 w-4" />
            {notes ? "Edit notes" : "Add notes"}
          </Button>
        </div>
      )}
    </Card>
  );
}
