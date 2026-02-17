"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

export function UserSettings() {
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTyped, setDeleteTyped] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const router = useRouter();

  const handleDownloadData = async () => {
    setExportLoading(true);
    setExportError(null);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to export data");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";]+)"?/);
      const filename = match?.[1] ?? `workvouch-data-${Date.now()}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteTyped !== "DELETE") return;
    setDeleteError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete account.");
        setLoading(false);
        return;
      }
      await supabaseBrowser.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setDeleteError("Something went wrong. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Account Settings
        </h2>
        <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
          Manage your account information and preferences.
        </p>
        <Button href="/dashboard">Edit Profile</Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Download my data
        </h2>
        <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
          Export your profile and employment history as a JSON file. You can use this for your records or to move your data elsewhere.
        </p>
        {exportError && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{exportError}</p>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownloadData}
          disabled={exportLoading}
        >
          {exportLoading ? "Preparing…" : "Download my data (JSON)"}
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Privacy Settings
        </h2>
        <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
          Control who can see your profile and information.
        </p>
        <Button href="/dashboard">Manage Privacy</Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Subscription
        </h2>
        <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
          View and manage your subscription plan.
        </p>
        <Button href="/pricing">View Plans</Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Legal & Support
        </h2>
        <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
          Privacy, terms, and contact options required for app stores.
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/legal/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/legal/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-primary hover:underline">
              Contact Support
            </Link>
          </li>
        </ul>
      </Card>

      <Card className="p-6 border-red-200 dark:border-red-900/50">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">
          Danger zone
        </h2>
        <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Delete my account
        </h3>
        <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
          Permanently delete your account and data. This cannot be undone. Your access will be fully removed and the deletion is logged for audit.
        </p>
        {deleteError && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{deleteError}</p>
        )}
        {!deleteConfirm ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteConfirm(true)}
            disabled={loading}
          >
            I want to delete my account
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-grey-dark dark:text-gray-200">
              This is permanent. You will be signed out and your account and data will be removed.
            </p>
            <p className="text-sm text-grey-dark dark:text-gray-200">
              Type <strong>DELETE</strong> below to confirm:
            </p>
            <input
              type="text"
              value={deleteTyped}
              onChange={(e) => setDeleteTyped(e.target.value)}
              placeholder="DELETE"
              className="w-full max-w-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-grey-dark dark:text-gray-200"
              disabled={loading}
              autoComplete="off"
              data-testid="delete-account-confirm-input"
            />
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={loading || deleteTyped !== "DELETE"}
              >
                {loading ? "Deleting…" : "Yes, delete my account"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setDeleteConfirm(false); setDeleteTyped(""); setDeleteError(null); }}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
