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
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
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
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
          Delete Account
        </h2>
        <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
          Permanently delete your account and data. This cannot be undone.
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
          <div className="space-y-2">
            <p className="text-sm text-grey-dark dark:text-gray-200">
              Are you sure? You will be signed out and your account will be removed.
            </p>
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? "Deleting…" : "Yes, delete my account"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setDeleteConfirm(false); setDeleteError(null); }}
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
