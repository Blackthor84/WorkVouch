"use client";

import { useEffect, useState } from "react";

export default function PricingPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPrices() {
      try {
        const res = await fetch("/api/prices");

        if (!res.ok) {
          throw new Error("Failed to load prices");
        }

        const data = await res.json();
        console.log("Loaded prices:", data);

        if (!data.success) {
          throw new Error("API returned success=false");
        }

        setPrices(data.prices);
      } catch (err: any) {
        console.error("Failed to fetch prices:", err);
        setError("Unable to load pricing. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadPrices();
  }, []);

  async function startCheckout(priceId: string) {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();
      console.log("Checkout response:", data);

      if (!data.url) {
        alert("Failed to start checkout: " + (data.error || "Unknown error"));
        return;
      }

      window.location.href = data.url; // redirect to Stripe checkout
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Checkout error. Please try again.");
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold text-center mb-8">
        WorkVouch Pricing
      </h1>

      {loading && <p className="text-center">Loading...</p>}

      {error && (
        <p className="text-center text-red-500 font-semibold mb-8">{error}</p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {prices.map((price) => (
            <div
              key={price.id}
              className="border rounded-lg p-6 shadow bg-white text-center"
            >
              <h2 className="text-2xl font-bold mb-2">
                {price.productName}
              </h2>

              <p className="text-gray-500 text-lg mb-4 capitalize">
                {price.type === "recurring" ? "Subscription" : "One-time payment"}
              </p>

              <p className="text-4xl font-bold mb-4">
                {price.unit_amount === 0
                  ? "Free"
                  : `$${(price.unit_amount / 100).toFixed(2)}`}
              </p>

              <button
                onClick={() => startCheckout(price.id)}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                {price.unit_amount === 0 ? "Get Started" : "Subscribe"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
