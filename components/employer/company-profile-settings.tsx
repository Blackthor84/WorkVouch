"use client";

import Link from "next/link";
import { WvCard } from "@/components/wv";

export function CompanyProfileSettings() {
  return (
    <div className="space-y-6">
      <WvCard>
        <p className="text-wv-muted">
          Company profile settings coming soon. This will allow you to customize
          your company information, logo, and preferences.
        </p>
      </WvCard>

      <WvCard>
        <h2 className="text-lg font-semibold text-wv-foreground mb-4">Legal & Account</h2>
        <p className="text-sm text-wv-muted mb-4">
          Privacy, terms, contact support, and account deletion (required for app stores).
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/legal/privacy" className="text-blue-400 hover:text-blue-300 hover:underline">
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/legal/terms" className="text-blue-400 hover:text-blue-300 hover:underline">
              Terms of Service
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-blue-400 hover:text-blue-300 hover:underline">
              Contact Support
            </Link>
          </li>
          <li>
            <Link href="/settings" className="text-blue-400 hover:text-blue-300 hover:underline">
              Account settings & delete account
            </Link>
          </li>
        </ul>
      </WvCard>
    </div>
  );
}
