"use client";

import { useState } from "react";

interface PriceButtonProps {
  priceId: string; // Stripe price ID
  label: string;   // Button text
}

export default function PriceButton({ priceId, label }: PriceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Free tier shortcut
      if (priceId === "free" || priceId === "price_0") {
        window.location.href = "/pricing/success?session_id=free";
        return;
      }

      // Call your /api/checkout route
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to start checkout");

      if (!data.url) throw new Error("Stripe did not return a checkout URL");

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: "0.5rem 0" }}>
      <button
        onClick={handleCheckout}
        disabled={loading}
        style={{
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
          cursor: loading ? "not-allowed" : "pointer",
          backgroundColor: "#635BFF",
          color: "#fff",
          border: "none",
          borderRadius: "0.5rem",
        }}
      >
        {loading ? "Processing..." : label}
      </button>
      {error && <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>}
    </div>
  );
}
