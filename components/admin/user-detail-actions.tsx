"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  userId: string;
  currentStatus: string;
  currentRole: string;
  isSuperAdmin: boolean;
  fullName: string;
  industry: string;
};

export function UserDetailActions({
  userId,
  currentStatus,
  currentRole,
  isSuperAdmin,
  fullName,
  industry,
}: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [editName, setEditName] = useState(fullName);
  const [editIndustry, setEditIndustry] = useState(industry);
  const [editRole, setEditRole] = useState(currentRole || "candidate");

  const run = async (
    label: string,
    method: string,
    url: string,
    body?: object
  ): Promise<boolean> => {
    setLoading(label);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Request failed");
        return false;
      }
      router.refresh();
      setEditOpen(false);
      setRoleOpen(false);
      return true;
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-grey-background dark:border-[#374151] flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
        Edit Profile
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setRoleOpen(true)}>
        Change Role
      </Button>
      {currentStatus === "suspended" ? (
        <Button
          variant="info"
          size="sm"
          disabled={!!loading}
          onClick={() =>
            run("Unsuspend", "POST", `/api/admin/users/${userId}/unsuspend`)
          }
        >
          Unsuspend
        </Button>
      ) : (
        <Button
          variant="danger"
          size="sm"
          disabled={!!loading || currentStatus === "deleted"}
          onClick={() =>
            run("Suspend", "POST", `/api/admin/users/${userId}/suspend`)
          }
        >
          Suspend
        </Button>
      )}
      <Button
        variant="danger"
        size="sm"
        disabled={!!loading || currentStatus === "deleted"}
        onClick={() => {
          if (!confirm("Soft delete this user? They will be marked as deleted.")) return;
          run("Soft delete", "POST", `/api/admin/users/${userId}/soft-delete`);
        }}
      >
        Soft Delete
      </Button>
      {isSuperAdmin && (
        <Button
          variant="danger"
          size="sm"
          disabled={!!loading}
          onClick={async () => {
            if (!confirm("Permanently delete this user? This cannot be undone.")) return;
            const ok = await run("Hard delete", "DELETE", `/api/admin/users/${userId}/hard-delete`);
            if (ok) router.push("/admin/users");
          }}
        >
          Hard Delete
        </Button>
      )}
      <Button
        variant="info"
        size="sm"
        disabled={!!loading}
        onClick={() =>
          run("Recalc", "POST", `/api/admin/users/${userId}/recalculate`)
        }
      >
        Force Intelligence Recalculation
      </Button>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-300 mb-1">Industry</label>
              <input
                type="text"
                className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
                value={editIndustry}
                onChange={(e) => setEditIndustry(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={loading === "Edit"}
                onClick={() =>
                  run("Edit", "PATCH", `/api/admin/users/${userId}`, {
                    full_name: editName,
                    industry: editIndustry,
                  })
                }
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-300 mb-1">Role</label>
              <select
                className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
              >
                <option value="candidate">candidate</option>
                <option value="employer">employer</option>
                <option value="admin">admin</option>
                <option value="superadmin">superadmin</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setRoleOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={loading === "Role"}
                onClick={() =>
                  run("Role", "PATCH", `/api/admin/users/${userId}`, { role: editRole })
                }
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
