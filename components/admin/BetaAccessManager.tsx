"use client";

import { useState } from "react";

export default function BetaAccessManager() {
  const [email, setEmail] = useState("");
  const [expirationDays, setExpirationDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    loginUrl?: string;
  } | null>(null);

  const handleCreateBetaAccess = async () => {
    if (!email || !email.includes("@")) {
      setResult({
        success: false,
        message: "Please enter a valid email address",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/create-beta-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          expirationDays: parseInt(expirationDays.toString()) || 7,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create beta access");
      }

      setResult({
        success: true,
        message: data.message || "Beta access created successfully!",
        loginUrl: data.loginUrl,
      });

      // Reset form
      setEmail("");
      setExpirationDays(7);
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Failed to create beta access",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyLoginUrl = () => {
    if (result?.loginUrl) {
      navigator.clipboard.writeText(result.loginUrl);
      alert("Login URL copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Create Beta Access</h2>
        <p className="text-gray-600">
          Grant temporary preview access to users. They'll receive a one-click login link.
        </p>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Beta User Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full border p-2 rounded"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Expiration (days)
          </label>
          <input
            type="number"
            value={expirationDays}
            onChange={(e) => setExpirationDays(parseInt(e.target.value) || 7)}
            min="1"
            max="365"
            className="w-full border p-2 rounded"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Beta access will expire after {expirationDays} day{expirationDays !== 1 ? "s" : ""}.
          </p>
        </div>

        <button
          onClick={handleCreateBetaAccess}
          disabled={loading || !email}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {loading ? "Creating..." : "Create Beta Access"}
        </button>

        {result && (
          <div
            className={`p-4 rounded ${
              result.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <p
              className={`font-semibold ${
                result.success ? "text-green-800" : "text-red-800"
              }`}
            >
              {result.message}
            </p>
            {result.success && result.loginUrl && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-green-700 font-semibold">
                  One-Click Login URL:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={result.loginUrl}
                    readOnly
                    className="flex-1 border p-2 rounded text-sm bg-white"
                  />
                  <button
                    onClick={copyLoginUrl}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Share this URL with the beta user. They can click it to log in instantly.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">How Beta Access Works:</h3>
        <ul className="list-disc pl-6 space-y-1 text-sm text-blue-700">
          <li>Beta users can browse and preview the site</li>
          <li>They cannot access pricing or checkout pages</li>
          <li>Access automatically expires after the set number of days</li>
          <li>One-click login link allows instant access without password</li>
        </ul>
      </div>
    </div>
  );
}
