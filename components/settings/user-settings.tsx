"use client";

import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { updateProfile } from "@/lib/actions/profile";
import { getCurrentUserProfile } from "@/lib/auth";

export function UserSettings() {
  const [loading, setLoading] = useState(false);

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
    </div>
  );
}
