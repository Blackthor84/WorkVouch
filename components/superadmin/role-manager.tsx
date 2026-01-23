"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export function RoleManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const supabase = supabaseClient;

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, full_name, role, created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } catch (error: any) {
        console.error("Error fetching users:", error);
        alert("Error fetching users: " + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [supabase]);

  const updateRole = async (id: string, newRole: string) => {
    setUpdating(id);
    try {
      const supabaseAny = supabase as any;
      const { error } = await supabaseAny
        .from("profiles")
        .update({ role: newRole })
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setUsers(users.map((u) => (u.id === id ? { ...u, role: newRole } : u)));

      // Also update auth metadata
      const { error: metadataError } = await supabase.auth.admin.updateUserById(
        id,
        {
          user_metadata: { role: newRole },
        },
      );

      if (metadataError) {
        console.warn("Could not update auth metadata:", metadataError);
      }
    } catch (error: any) {
      console.error("Error updating role:", error);
      alert("Error updating role: " + error.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.id} className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <p className="font-semibold text-grey-dark dark:text-gray-200">
                {user.full_name || "No name"}
              </p>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                {user.email}
              </p>
            </div>

            <select
              value={user.role || "user"}
              onChange={(e) => updateRole(user.id, e.target.value)}
              disabled={updating === user.id}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-[#1A1F2B] text-grey-dark dark:text-gray-200 min-w-[150px] disabled:opacity-50"
            >
              <option value="user">User</option>
              <option value="employer">Employer</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>

            {updating === user.id && (
              <span className="text-sm text-grey-medium dark:text-gray-400">
                Updating...
              </span>
            )}
          </div>
        </Card>
      ))}

      {users.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-grey-medium dark:text-gray-400">No users found</p>
        </Card>
      )}
    </div>
  );
}
