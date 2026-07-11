"use client";

import { useState } from "react";
import Link from "next/link";
import { WvButton, WvInput } from "@/components/wv";

export function EmployerAccessForm() {
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/employers/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, company, email }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(typeof data.error === "string" ? data.error : "Something went wrong.");
        return;
      }
      setStatus("success");
      setMessage("Thanks — we'll be in touch shortly.");
      setFullName("");
      setCompany("");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  if (status === "success") {
    return (
      <div
        id="request-access"
        className="scroll-mt-24 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-8 text-center"
      >
        <p className="text-lg font-semibold text-emerald-300">{message}</p>
        <p className="mt-2 text-sm text-emerald-400/80">Our team will reach out at the email you provided.</p>
      </div>
    );
  }

  return (
    <form id="request-access" onSubmit={onSubmit} className="scroll-mt-24 space-y-4" aria-labelledby="request-access-heading">
      <WvInput
        id="employer-name"
        name="fullName"
        type="text"
        required
        autoComplete="name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full name"
        label="Name"
      />
      <WvInput
        id="employer-company"
        name="company"
        type="text"
        required
        autoComplete="organization"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Company name"
        label="Company"
      />
      <WvInput
        id="employer-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        label="Email"
      />

      {status === "error" && message ? (
        <p className="text-center text-sm text-red-400" role="alert">
          {message}
        </p>
      ) : null}

      <WvButton type="submit" disabled={status === "loading"} className="w-full" size="lg">
        {status === "loading" ? "Sending…" : "Request Access"}
      </WvButton>

      <p className="text-center text-xs text-wv-subtle">
        We respect your inbox — no spam. See our{" "}
        <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
