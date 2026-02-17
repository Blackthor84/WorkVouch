"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function VerifyEmailPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser;
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoading(false);
      if (!user) {
        window.location.href = "/login";
        return;
      }
      if ((user as { email_confirmed_at?: string | null }).email_confirmed_at) {
        window.location.href = "/api/auth/redirect-destination";
        return;
      }
      setUserEmail(user.email ?? null);
    });
  }, []);

  const handleResend = async () => {
    if (!userEmail) return;
    setResendLoading(true);
    setMessage(null);
    const supabase = supabaseBrowser;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: userEmail,
    });
    setResendLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message || "Failed to resend verification email." });
      return;
    }
    setMessage({ type: "success", text: "Verification email sent. Check your inbox and spam folder." });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4 overflow-x-hidden">
      <Link href="/" className="mb-6">
        <Image
          src="/images/workvouch-logo.png.png"
          alt="WorkVouch"
          width={180}
          height={48}
          className="h-10 w-auto object-contain"
          priority
          style={{ objectFit: "contain" }}
        />
      </Link>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white">
          Verify your email
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-6">
          You need to verify your email address before you can access your dashboard. We sent a
          verification link to <strong>{userEmail ?? "your email"}</strong>. Click the link in that
          email to continue.
        </p>
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm border ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
            }`}
          >
            {message.text}
          </div>
        )}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendLoading || !userEmail}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendLoading ? "Sending…" : "Resend verification email"}
        </button>
        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          Already verified?{" "}
          <Link href="/api/auth/redirect-destination" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Continue to dashboard
          </Link>
        </p>
        <p className="text-center mt-4 text-sm text-gray-500 dark:text-gray-500">
          <button
            type="button"
            onClick={async () => {
              await supabaseBrowser.auth.signOut();
              window.location.href = "/login";
            }}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Sign out and use a different account
          </button>
        </p>
      </div>
    </div>
  );
}
