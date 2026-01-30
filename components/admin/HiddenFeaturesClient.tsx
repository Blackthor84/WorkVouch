"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type FeatureFlag = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  is_globally_enabled: boolean;
  visibility_type: "ui" | "api" | "both";
  required_subscription_tier: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  assignments: Array<{
    id: string;
    feature_flag_id: string;
    user_id: string | null;
    employer_id: string | null;
    enabled: boolean;
  }>;
  assignmentsCount?: number;
};

type UserOption = { id: string; email: string; full_name: string; roles: string[] };
type EmployerOption = { id: string; company_name: string; user_id: string };

export default function HiddenFeaturesClient({
  isSuperAdmin,
}: {
  isSuperAdmin: boolean;
}) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [employers, setEmployers] = useState<EmployerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createName, setCreateName] = useState("");
  const [createKey, setCreateKey] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createVisibility, setCreateVisibility] = useState<"ui" | "api" | "both">("both");
  const [createRequiredTier, setCreateRequiredTier] = useState("");
  const [creating, setCreating] = useState(false);
  const [assignFlagId, setAssignFlagId] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignEmployerId, setAssignEmployerId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [detailFlagId, setDetailFlagId] = useState<string | null>(null);
  const [editFlag, setEditFlag] = useState<FeatureFlag | null>(null);

  const fetchFlags = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/feature-flags", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load feature flags");
      const data = await res.json();
      setFlags(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/admin/feature-flags").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/employer-accounts").then((r) => r.json()),
    ])
      .then(([flagsData, usersData, employersData]) => {
        if (cancelled) return;
        setFlags(Array.isArray(flagsData) ? flagsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setEmployers(Array.isArray(employersData) ? employersData : []);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleGlobal = async (flag: FeatureFlag, checked: boolean) => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch(`/api/admin/feature-flags/${flag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_globally_enabled: checked }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      await fetchFlags();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleUpdateVisibility = async (flag: FeatureFlag, visibility: "ui" | "api" | "both") => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch(`/api/admin/feature-flags/${flag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility_type: visibility }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      await fetchFlags();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleUpdateRequiredTier = async (flag: FeatureFlag, tier: string) => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch(`/api/admin/feature-flags/${flag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ required_subscription_tier: tier.trim() || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      await fetchFlags();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleCreate = async () => {
    const name = createName.trim();
    if (!name) {
      alert("Name is required");
      return;
    }
    const key = createKey.trim() || name.toLowerCase().replace(/\s+/g, "_");
    setCreating(true);
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          key,
          description: createDesc.trim() || null,
          visibility_type: createVisibility,
          required_subscription_tier: createRequiredTier.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setCreateName("");
      setCreateKey("");
      setCreateDesc("");
      setCreateVisibility("both");
      setCreateRequiredTier("");
      await fetchFlags();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (flag: FeatureFlag) => {
    if (!isSuperAdmin || !confirm(`Delete feature "${flag.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/feature-flags/${flag.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      setDetailFlagId(null);
      setEditFlag(null);
      await fetchFlags();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleAddAssignment = async () => {
    if (!assignFlagId) return;
    const hasUser = assignUserId.trim() !== "";
    const hasEmployer = assignEmployerId.trim() !== "";
    if ((hasUser && hasEmployer) || (!hasUser && !hasEmployer)) {
      alert("Select either a user or an employer, not both.");
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch("/api/admin/feature-flags/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature_flag_id: assignFlagId,
          user_id: hasUser ? assignUserId : null,
          employer_id: hasEmployer ? assignEmployerId : null,
          enabled: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assign failed");
      setAssignFlagId(null);
      setAssignUserId("");
      setAssignEmployerId("");
      await fetchFlags();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Assign failed");
    } finally {
      setAssigning(false);
    }
  };

  const handleToggleAssignment = async (assignmentId: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/feature-flags/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      await fetchFlags();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Remove this assignment?")) return;
    try {
      const res = await fetch(`/api/admin/feature-flags/assignments/${assignmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchFlags();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString(undefined, { dateStyle: "short" });

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-grey-medium dark:text-gray-400">Loading hidden features…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <Link href="/admin">
          <Button variant="secondary" className="mt-4">Back to Admin</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">Hidden Features</h1>
          <p className="text-grey-medium dark:text-gray-400">
            Hidden features only appear in the main UI when globally enabled or assigned. Only Admin and SuperAdmin can see this section.
          </p>
        </div>
        <Link href="/admin">
          <Button variant="secondary">Back to Admin</Button>
        </Link>
      </div>

      {isSuperAdmin && (
        <Card className="mb-8 p-6">
          <CardHeader>
            <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">Create feature (SuperAdmin only)</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="e.g. Rehire Indicator" className="mt-1" />
              </div>
              <div>
                <Label>Key (internal, e.g. rehire_indicator)</Label>
                <Input value={createKey} onChange={(e) => setCreateKey(e.target.value)} placeholder="rehire_indicator" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} placeholder="Short description" className="mt-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Visibility</Label>
                <select
                  value={createVisibility}
                  onChange={(e) => setCreateVisibility(e.target.value as "ui" | "api" | "both")}
                  className="mt-1 w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
                >
                  <option value="ui">UI</option>
                  <option value="api">API</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <Label>Required tier (optional)</Label>
                <Input value={createRequiredTier} onChange={(e) => setCreateRequiredTier(e.target.value)} placeholder="e.g. pro" className="mt-1" />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={creating}>{creating ? "Creating…" : "Create feature"}</Button>
          </CardContent>
        </Card>
      )}

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-[#1A1F2B] rounded-xl overflow-hidden">
            <thead className="bg-gray-100 dark:bg-[#0D1117]">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">Feature Name</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">Key</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">Global</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">Required Tier</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">Visibility</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">Assignments</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">Created</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flags.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-grey-medium dark:text-gray-400">
                    No feature flags yet. SuperAdmin can create one above.
                  </td>
                </tr>
              ) : (
                flags.map((flag) => (
                  <tr key={flag.id} className="border-b border-grey-background dark:border-[#374151]">
                    <td className="py-3 px-4 text-sm text-grey-dark dark:text-gray-200">{flag.name}</td>
                    <td className="py-3 px-4 text-sm font-mono text-grey-medium dark:text-gray-400">{flag.key ?? flag.name}</td>
                    <td className="py-3 px-4">
                      <Switch
                        checked={flag.is_globally_enabled}
                        onCheckedChange={(c) => handleToggleGlobal(flag, c)}
                        disabled={!isSuperAdmin}
                      />
                    </td>
                    <td className="py-3 px-4 text-sm text-grey-medium dark:text-gray-400">
                      {flag.required_subscription_tier ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {isSuperAdmin ? (
                        <select
                          value={flag.visibility_type ?? "both"}
                          onChange={(e) => handleUpdateVisibility(flag, e.target.value as "ui" | "api" | "both")}
                          className="rounded border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-2 py-1 text-sm"
                        >
                          <option value="ui">UI</option>
                          <option value="api">API</option>
                          <option value="both">Both</option>
                        </select>
                      ) : (
                        <span className="text-grey-medium dark:text-gray-400">{flag.visibility_type ?? "both"}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-grey-dark dark:text-gray-200">{flag.assignmentsCount ?? flag.assignments?.length ?? 0}</td>
                    <td className="py-3 px-4 text-sm text-grey-medium dark:text-gray-400">{formatDate(flag.created_at)}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setDetailFlagId(detailFlagId === flag.id ? null : flag.id)}>
                          Details
                        </Button>
                        {isSuperAdmin && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => setEditFlag(editFlag?.id === flag.id ? null : flag)}>Edit</Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(flag)}>Delete</Button>
                          </>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setAssignFlagId(flag.id);
                            setAssignUserId("");
                            setAssignEmployerId("");
                          }}
                        >
                          Assign
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {detailFlagId && flags.find((f) => f.id === detailFlagId) && (
          <div className="mt-6 pt-6 border-t border-grey-background dark:border-[#374151]">
            <h4 className="text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Assignments</h4>
            <ul className="space-y-2">
              {flags.find((f) => f.id === detailFlagId)!.assignments.length === 0 ? (
                <li className="text-sm text-grey-medium dark:text-gray-400">No assignments.</li>
              ) : (
                flags.find((f) => f.id === detailFlagId)!.assignments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 text-sm bg-grey-background/50 dark:bg-[#1A1F2B] rounded-lg px-3 py-2">
                    <span>
                      {a.user_id ? users.find((u) => u.id === a.user_id)?.email ?? a.user_id : employers.find((e) => e.id === a.employer_id)?.company_name ?? a.employer_id}
                      {a.user_id ? <Badge variant="secondary" className="ml-2">User</Badge> : <Badge variant="outline" className="ml-2">Employer</Badge>}
                    </span>
                    <div className="flex items-center gap-2">
                      <Switch checked={a.enabled} onCheckedChange={(c) => handleToggleAssignment(a.id, c)} />
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteAssignment(a.id)}>Remove</Button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {editFlag && isSuperAdmin && (
          <div className="mt-6 pt-6 border-t border-grey-background dark:border-[#374151]">
            <h4 className="text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Edit: {editFlag.name}</h4>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <Label className="text-xs">Required tier</Label>
                <Input
                  defaultValue={editFlag.required_subscription_tier ?? ""}
                  onBlur={(e) => handleUpdateRequiredTier(editFlag, e.target.value)}
                  placeholder="e.g. pro"
                  className="mt-1 w-32"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditFlag(null)}>Close</Button>
            </div>
          </div>
        )}

        {assignFlagId && (
          <div className="mt-6 pt-6 border-t border-grey-background dark:border-[#374151]">
            <h4 className="text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Add assignment</h4>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[200px]">
                <Label className="text-xs">User</Label>
                <select
                  value={assignUserId}
                  onChange={(e) => { setAssignUserId(e.target.value); setAssignEmployerId(""); }}
                  className="mt-1 w-full rounded border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-2 py-1.5 text-sm"
                >
                  <option value="">— Select user —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[200px]">
                <Label className="text-xs">Employer</Label>
                <select
                  value={assignEmployerId}
                  onChange={(e) => { setAssignEmployerId(e.target.value); setAssignUserId(""); }}
                  className="mt-1 w-full rounded border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-2 py-1.5 text-sm"
                >
                  <option value="">— Select employer —</option>
                  {employers.map((e) => (
                    <option key={e.id} value={e.id}>{e.company_name}</option>
                  ))}
                </select>
              </div>
              <Button size="sm" disabled={assigning || (!assignUserId && !assignEmployerId)} onClick={handleAddAssignment}>
                {assigning ? "Adding…" : "Add"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setAssignFlagId(null); setAssignUserId(""); setAssignEmployerId(""); }}>Cancel</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
