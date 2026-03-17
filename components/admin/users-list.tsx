"use client";

import { useEffect, useState, useCallback } from "react";

interface DebugUser {
  id: string;
  email: string;
  role: string;
}

type AdminUsersListProps = { role?: string };

export function AdminUsersList({ role = "admin" }: AdminUsersListProps) {
  const [users, setUsers] = useState<DebugUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data?.error ?? "Error loading users");
        setUsers([]);
        return;
      }
      if (data?.error) {
        setFetchError(data.error);
        setUsers([]);
        return;
      }
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setFetchError("Error loading users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return <p className="p-4 text-[#334155]">Loading...</p>;
  }

  if (fetchError) {
    return <p className="p-4 text-red-600">Error loading users</p>;
  }

  if (!users || users.length === 0) {
    return <p className="p-4 text-[#64748B]">No users found (debug mode)</p>;
  }

  return (
    <div>
      {users.map((user) => (
        <div key={user.id} className="p-3 border rounded mb-2">
          <p>{user.email}</p>
          <p>{user.role || "no role"}</p>
        </div>
      ))}
    </div>
  );
}
