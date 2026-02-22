"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminUser {
  id: string;
  userId: string;
  email: string;
  full_name: string;
  role: string | null;
  status: string;
  created_at: string;
}

export function AdminUsersList() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (email) params.set("email", email);
      if (name) params.set("name", name);
      if (org) params.set("org", org);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [email, name, org]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const runStatusAction = async (userId: string, action: "suspend" | "unsuspend") => {
    setActionLoading(userId);
    try {
      const url = action === "suspend"
        ? `/api/admin/users/${userId}/suspend`
        : `/api/admin/users/${userId}/unsuspend`;
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Action failed");
        return;
      }
      router.refresh();
      await fetchUsers();
    } catch (e) {
      console.error("Status action error:", e);
      alert("Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-lg">
        <p className="text-[#334155]">Loading users…</p>
      </div>
    );
  }

  const filteredUsers = roleFilter
    ? users.filter((u) => (u.role ?? "").toLowerCase() === roleFilter.toLowerCase())
    : users;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm w-40"
        />
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm w-40"
        />
        <input
          type="text"
          placeholder="Org"
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm w-40"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm w-32"
        >
          <option value="">All roles</option>
          <option value="candidate">candidate</option>
          <option value="employer">employer</option>
          <option value="admin">admin</option>
          <option value="superadmin">superadmin</option>
        </select>
        <Button variant="secondary" size="sm" onClick={() => fetchUsers()}>Search</Button>
      </div>
    <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-lg">
      <table className="min-w-full divide-y divide-[#E2E8F0]">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              Full name
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              Created
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0]">
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-[#64748B]">
                {email || name || org
                  ? "No users found. Try adjusting search filters."
                  : "No users in the system yet."}
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm text-[#334155]">{user.email}</td>
                <td className="px-4 py-3 text-sm text-[#334155]">{user.full_name || "—"}</td>
                <td className="px-4 py-3 text-sm text-[#334155]">{user.role ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={user.status === "active" ? "default" : "secondary"} className="capitalize">
                    {user.status === "suspended" ? "Suspended" : user.status === "deleted" ? "Deleted" : "Active"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-[#64748B]">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Button variant="secondary" size="sm" href={`/admin/users/${user.id}`}>
                    Manage
                  </Button>
                  {user.status === "suspended" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!!actionLoading}
                      onClick={() => runStatusAction(user.id, "unsuspend")}
                    >
                      {actionLoading === user.id ? "…" : "Reactivate"}
                    </Button>
                  ) : user.status !== "deleted" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!!actionLoading}
                      onClick={() => runStatusAction(user.id, "suspend")}
                    >
                      {actionLoading === user.id ? "…" : "Suspend"}
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-slate-50 text-[#334155]"
                    onClick={async () => {
                      const userId = typeof user?.userId === "string" ? user.userId.trim() : "";
                      if (!userId) {
                        alert("No user ID");
                        return;
                      }
                      try {
                        const res = await fetch("/api/admin/impersonate", {
                          method: "POST",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId }),
                        });
                        if (!res.ok) {
                          const err = await res.json().catch(() => ({}));
                          alert((err as { error?: string }).error ?? "Impersonation failed");
                          return;
                        }
                        window.location.href = "/dashboard";
                      } catch (e) {
                        console.error("Impersonate error:", e);
                        alert("Impersonation failed");
                      }
                    }}
                  >
                    View as User
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
}
