"use client";

import Link from "next/link";
import { Card } from "../ui/card";

export function CompanyProfileSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
          Company Profile Settings
        </h2>
        <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">
          Manage your company information and preferences
        </p>
      </div>

      <Card className="p-6">
        <p className="text-grey-medium dark:text-gray-400">
          Company profile settings coming soon. This will allow you to customize
          your company information, logo, and preferences.
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Legal & Account
        </h2>
        <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
          Privacy, terms, contact support, and account deletion (required for app stores).
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
          <li>
            <Link href="/settings" className="text-primary hover:underline">
              Account settings & delete account
            </Link>
          </li>
        </ul>
      </Card>
    </div>
  );
}
