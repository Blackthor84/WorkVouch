"use client";

import { useState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { ProfileVisibility } from "@/types/database";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { UserCircleIcon, PencilIcon } from "@heroicons/react/24/outline";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  city: string | null;
  state: string | null;
  professional_summary: string | null;
  visibility: ProfileVisibility;
  profile_photo_url: string | null;
}

export function ProfileSection({ profile }: { profile: Profile }) {
  const [editing, setEditing] = useState(false);
  const [accountEditOpen, setAccountEditOpen] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({ full_name: profile.full_name });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile.full_name,
    city: profile.city || "",
    state: profile.state || "",
    professional_summary: profile.professional_summary || "",
    visibility: profile.visibility,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(formData);
      setEditing(false);
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountEditOpen = (open: boolean) => {
    setAccountEditOpen(open);
    if (open) {
      setAccountForm({ full_name: profile.full_name });
      setAccountError(null);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError(null);
    setAccountLoading(true);
    try {
      const res = await fetch("/api/account/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: accountForm.full_name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAccountError(data?.error ?? "Update failed");
        return;
      }
      setAccountEditOpen(false);
      window.location.reload();
    } catch {
      setAccountError("An error occurred");
    } finally {
      setAccountLoading(false);
    }
  };

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Professional Summary
              </label>
              <textarea
                rows={4}
                value={formData.professional_summary}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    professional_summary: e.target.value,
                  })
                }
                className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    visibility: e.target.value as ProfileVisibility,
                  })
                }
                className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card hover>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              {profile.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt={profile.full_name}
                  className="h-16 w-16 rounded-2xl object-cover"
                />
              ) : (
                <UserCircleIcon className="h-10 w-10 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
              <p className="mt-1 text-sm text-grey-medium dark:text-gray-300 font-medium">
                {profile.email}
              </p>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    profile.visibility === "public"
                      ? "bg-green-100 text-green-700"
                      : "bg-grey-background dark:bg-[#111827] text-grey-medium dark:text-gray-300"
                  }`}
                >
                  {profile.visibility === "public" ? "Public" : "Private"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleAccountEditOpen(true)}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </CardHeader>
      <Dialog open={accountEditOpen} onOpenChange={handleAccountEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAccountSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">Name</label>
              <input
                type="text"
                required
                minLength={2}
                className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3"
                value={accountForm.full_name}
                onChange={(e) => setAccountForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <p className="text-sm text-grey-medium dark:text-gray-400">
              To change your email, go to <a href="/settings" className="text-primary underline">Settings → Change Email</a>.
            </p>
            {accountError && <p className="text-sm text-red-600 dark:text-red-400">{accountError}</p>}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={accountLoading}>{accountLoading ? "Saving..." : "Save"}</Button>
              <Button type="button" variant="ghost" onClick={() => handleAccountEditOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <CardContent>
        <div className="space-y-4">
          {(profile.city || profile.state) && (
            <div>
              <h4 className="text-sm font-semibold text-grey-dark dark:text-gray-200 mb-1">
                Location
              </h4>
              <p className="text-grey-dark dark:text-gray-200 font-semibold">
                {[profile.city, profile.state].filter(Boolean).join(", ") ||
                  "Not specified"}
              </p>
            </div>
          )}
          {profile.professional_summary && (
            <div>
              <h4 className="text-sm font-bold text-grey-dark dark:text-gray-200 mb-1">
                Professional Summary
              </h4>
              <p className="text-grey-dark dark:text-gray-200 leading-relaxed font-medium">
                {profile.professional_summary}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
