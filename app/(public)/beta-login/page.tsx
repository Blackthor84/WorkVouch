"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

function BetaLoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Logging you in...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No login token provided.");
      return;
    }

    // Authenticate with token via API
    fetch("/api/beta/authenticate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Authentication failed");
        }

        // For beta users, we need to create a session
        // Since they don't have a password, we'll use Supabase magic link
        // or create a temporary session via API
        try {
          // Try to sign in via Supabase magic link
          const supabaseResponse = await fetch("/api/beta/create-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: data.userId, email: data.email }),
          });

          if (supabaseResponse.ok) {
            setStatus("success");
            setMessage("Login successful! Redirecting...");
            setTimeout(() => {
              router.push("/preview-only");
              router.refresh();
            }, 1000);
          } else {
            // Fallback: redirect to preview page (proxy will handle auth)
            window.location.href = `/preview-only?token=${token}`;
          }
        } catch (error) {
          // Fallback: redirect to preview page
          window.location.href = `/preview-only?token=${token}`;
        }
      })
      .catch((error) => {
        console.error("Beta login error:", error);
        setStatus("error");
        setMessage(error.message || "Invalid or expired login link.");
      });
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-green-700 font-semibold">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-red-700 mb-4">{message}</p>
            <a
              href="/login"
              className="text-blue-600 hover:underline"
            >
              Go to regular login
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <BetaLoginContent />
    </Suspense>
  );
}
