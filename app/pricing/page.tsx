"use client";

import { useEffect, useState } from "react";

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  productName: string;
  type: "recurring" | "one_time";
}

export default function PricingPage() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch prices from the API
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/prices");
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        const data = await res.json();

        if (!data.success || !Array.isArray(data.prices)) {
          throw new Error("Invalid response from prices API");
        }

        setPrices(data.prices);
      } catch (err: any) {
        console.error("Failed to fetch prices:", err);
        setError("Unable to load pricing. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  // Handle checkout button click
  const handleCheckout = async (priceId: string) => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      if (!data.url) throw new Error("Checkout URL missing");

      window.location.href = data.url;
    } catch (err: any) {
      console.error("Checkout failed:", err);
      alert(`Failed to start checkout: ${err.message}`);
    }
  };

  if (loading) return <p>Loading pricing...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">WorkVouch Pricing</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {prices.map((price) => (
          <div
            key={price.id}
            className="border rounded-lg p-6 shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold mb-2">{price.productName}</h2>
            <p className="text-gray-700 mb-4">
              {price.unit_amount === 0
                ? "Free"
                : `$${(price.unit_amount / 100).toFixed(2)} / ${
                    price.type === "recurring" ? "month" : "one-time"
                  }`}
            </p>
            <button
              onClick={() => handleCheckout(price.id)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Choose Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
