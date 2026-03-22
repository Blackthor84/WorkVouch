"use client";

import { useState } from "react";

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

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

  if (status === "success") {
    return (
      <div
        id="request-access"
        className="scroll-mt-24 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-8 text-center"
      >
        <p className="text-lg font-semibold text-emerald-900">{message}</p>
        <p className="mt-2 text-sm text-emerald-800/90">Our team will reach out at the email you provided.</p>
      </div>
    );
  }

  return (
    <form id="request-access" onSubmit={onSubmit} className="scroll-mt-24">
      <div className="space-y-0">
        <div>
          <label htmlFor="employer-name" className="sr-only">
            Name
          </label>
          <input
            id="employer-name"
            name="fullName"
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
            placeholder="Name"
          />
        </div>
        <div>
          <label htmlFor="employer-company" className="sr-only">
            Company
          </label>
          <input
            id="employer-company"
            name="company"
            type="text"
            required
            autoComplete="organization"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputClass}
            placeholder="Company"
          />
        </div>
        <div>
          <label htmlFor="employer-email" className="sr-only">
            Email
          </label>
          <input
            id="employer-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="Email"
          />
        </div>
      </div>

      {status === "error" && message ? (
        <p className="mt-4 text-center text-sm text-red-600" role="alert">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-2 w-full rounded bg-black px-4 py-2 font-semibold text-white transition hover:bg-gray-900 disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Request Access"}
      </button>

      <p className="mt-4 text-center text-xs text-gray-500">
        We respect your inbox — no spam. See our{" "}
        <a href="/privacy" className="underline hover:text-gray-800">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
