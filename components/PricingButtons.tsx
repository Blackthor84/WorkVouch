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

      // Debug log: show which priceId is being used
      console.log("Starting checkout for priceId:", priceId);

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

      // Debug log: show session URL
      console.log("Checkout session URL:", data.url);

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Unexpected error during checkout:", err);
      setError(err.message || "Unexpected error");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      {prices.map((price) => (
        <button
          key={price.id}
          onClick={() => handleCheckout(price.id)}
          disabled={loadingId === price.id}
          style={{ margin: "8px", padding: "12px 24px" }}
        >
          {loadingId === price.id ? "Loading..." : `Buy ${price.productName} ($${(price.unit_amount ?? 0) / 100})`}
        </button>
      ))}

      {error && (
        <div style={{ color: "red", marginTop: "12px" }}>
          {error}
        </div>
      )}
    </div>
  );
}
