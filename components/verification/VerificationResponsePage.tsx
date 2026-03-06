"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

type RequestPayload = {
  id: string;
  requester_name: string | null;
  company_name: string | null;
  job_title: string | null;
  target_email: string;
  relationship_type: string;
  created_at: string;
};

export function VerificationResponsePage() {
  const params = useParams();
  const token = typeof params?.token === "string" ? params.token : null;
  const [request, setRequest] = useState<RequestPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [responding, setResponding] = useState(false);
  const [responded, setResponded] = useState<"accept" | "decline" | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Invalid link");
      return;
    }
    fetch(`/api/verification/pending?token=${encodeURIComponent(token)}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) setError("Request not found or already responded");
          else setError("Failed to load request");
          return null;
        }
        return res.json();
      })
      .then((data: { request?: RequestPayload } | null) => {
        if (data?.request) setRequest(data.request);
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/user/me", { credentials: "include" })
      .then((res) => {
        setAuthenticated(res.ok);
      })
      .catch(() => setAuthenticated(false));
  }, [token]);

  const handleRespond = async (response: "accept" | "decline") => {
    if (!token) return;
    setResponding(true);
    setError(null);
    try {
      const res = await fetch("/api/verification/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ response_token: token, response }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to respond");
        return;
      }
      setResponded(response);
    } finally {
      setResponding(false);
    }
  };

  const returnUrl = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/verification/respond/${token}`
    : "/login";

  if (loading || (request && authenticated === null)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <p className="text-slate-600 dark:text-slate-400">Loading…</p>
        </Card>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Link href="/" className="text-[#2563EB] hover:underline">
            Return home
          </Link>
        </Card>
      </div>
    );
  }

  if (request && authenticated === false) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Verification request
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            <strong>{request.requester_name ?? "Someone"}</strong> is asking you to verify that you
            worked together at <strong>{request.company_name ?? ""}</strong>
            {request.job_title ? ` as ${request.job_title}` : ""}.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Log in or sign up to accept or decline this request.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button href={`/login?redirect=${encodeURIComponent(returnUrl)}`}>
              Log in
            </Button>
            <Button variant="secondary" href={`/signup?redirect=${encodeURIComponent(returnUrl)}`}>
              Sign up
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (responded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            {responded === "accept" ? "Request accepted" : "Request declined"}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {responded === "accept"
              ? "You confirmed the employment. Thank you."
              : "You declined the verification request."}
          </p>
          <Link href="/dashboard">
            <Button>Go to dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Verification request
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          <strong>{request?.requester_name ?? "Someone"}</strong> is asking you to verify that you
          worked together at <strong>{request?.company_name ?? ""}</strong>
          {request?.job_title ? ` as ${request.job_title}` : ""}.
        </p>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
        )}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={responding}
            onClick={() => handleRespond("decline")}
          >
            <XMarkIcon className="h-5 w-5 mr-2" />
            Decline
          </Button>
          <Button
            className="flex-1"
            disabled={responding}
            onClick={() => handleRespond("accept")}
          >
            {responding ? "..." : (
              <>
                <CheckIcon className="h-5 w-5 mr-2" />
                Accept
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
