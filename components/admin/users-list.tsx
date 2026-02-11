"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  created_at: string;
}

export function AdminUsersList() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { update: updateSession } = useSession();
  const router = useRouter();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching users:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-slate-300">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-[#111827] shadow-lg">
      <table className="min-w-full divide-y divide-slate-700">
        <thead className="bg-[#1f2937]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Full name
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Roles
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Created
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-[#1f2937] transition-colors"
            >
              <td className="px-4 py-3 text-sm text-slate-200">
                {user.email}
              </td>
              <td className="px-4 py-3 text-sm text-slate-200">
                {user.full_name || "—"}
              </td>
              <td className="px-4 py-3 text-sm text-slate-300">
                {user.roles.length ? user.roles.join(", ") : "—"}
              </td>
              <td className="px-4 py-3 text-sm text-slate-300">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                <Button variant="secondary" size="sm" href={`/admin/users/${user.id}`} className="bg-[#1f2937] text-slate-200 border-slate-600 hover:bg-[#374151]">
                  Manage
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-[#1f2937] text-slate-200"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/admin/impersonate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: user.id }),
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        alert(err?.error ?? "Impersonation failed");
                        return;
                      }
                      const data = await res.json();
                      if (data.impersonateUser) {
                        await updateSession({ impersonateUser: data.impersonateUser });
                        router.push("/dashboard");
                      }
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
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="px-4 py-8 text-center text-grey-medium dark:text-gray-400">
          No users found
        </div>
      )}
    </div>
  );
}
