"use client";

import { useState } from "react";

interface Price {
  id: string;
  unit_amount: number | null;
  currency: string;
  productName: string;
  type: string;
}

interface Props {
  prices: Price[];
}

export default function PricingButtons({ prices }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    try {
      setError(null);
      setLoadingId(priceId);

      console.log("Checkout clicked for priceId:", priceId);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        console.error("Checkout failed:", data);
        setError(`Checkout error: ${data.error || "Unknown error"}`);
        setLoadingId(null);
        return;
      }

      console.log("Redirecting to Stripe session URL:", data.url);

      window.location.href = data.url;
    } catch (err: any) {
      console.error("Unexpected checkout error:", err);
      setError(err.message || "Unexpected error");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "2rem" }}>
      {prices.map((price) => (
        <button
          key={price.id}
          onClick={() => handleCheckout(price.id)}
          disabled={loadingId === price.id}
          style={{
            padding: "1rem 2rem",
            fontSize: "1rem",
            cursor: "pointer",
            borderRadius: "8px",
            border: "1px solid #333",
            minWidth: "200px",
          }}
        >
          {loadingId === price.id
            ? "Loading..."
            : `${price.productName} ($${(price.unit_amount ?? 0) / 100})`}
        </button>
      ))}

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
    </div>
  );
}
