"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareIcon, ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tryworkvouch.com";

export function ShareProfileCard({ publicSlug }: { publicSlug: string | null }) {
  const [copied, setCopied] = useState(false);
  const link = publicSlug ? `${BASE_URL}/candidate/${publicSlug}` : null;

  const copyLink = () => {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShareIcon className="h-5 w-5" />
          Share My WorkVouch Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {link ? (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Share this link with employers during job applications. They can view your verified work history and coworker confirmations with a WorkVouch subscription.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-0 text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md truncate">
                {link}
              </code>
              <Button
                variant="secondary"
                size="sm"
                onClick={copyLink}
                className="shrink-0 inline-flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set a profile slug in{" "}
            <Link href="/dashboard/settings" className="text-blue-600 hover:underline dark:text-blue-400">
              Settings
            </Link>{" "}
            to get a shareable candidate link (e.g. {BASE_URL}/candidate/your-name).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
