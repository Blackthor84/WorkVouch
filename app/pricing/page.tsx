"use client";

import { useEffect, useState } from "react";

interface Price {
  id: string;
  unit_amount: number | null;
  currency: string;
  productName: string;
  type: "recurring" | "one_time";
}

export default function PricingPage() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/prices")
      .then(res => res.json())
      .then(data => {
        if (data.success) setPrices(data.prices);
        else setError(data.error || "Unable to load prices.");
      })
      .catch(() => setError("Unable to load prices."))
      .finally(() => setLoading(false));
  }, []);

  const handleCheckout = async (priceId: string) => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(`Failed to start checkout: ${data.error}`);
    } catch (err) {
      alert(`Checkout error: ${(err as Error).message}`);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Loading pricing...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <h1 className="text-4xl font-bold text-center mb-12">
        WorkVouch Pricing
      </h1>
      <div className="max-w-6xl mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {prices.map(p => (
          <div
            key={p.id}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-2xl font-semibold mb-4">{p.productName}</h2>
              <p className="text-3xl font-bold mb-4">
                {p.unit_amount != null ? `$${(p.unit_amount / 100).toFixed(2)}` : "Free"}
                {p.type === "recurring" ? "/mo" : ""}
              </p>
              {p.type === "recurring" && (
                <p className="text-gray-500 mb-6">Recurring monthly subscription</p>
              )}
              {p.type === "one_time" && (
                <p className="text-gray-500 mb-6">One-time payment</p>
              )}
            </div>
            <button
              onClick={() => handleCheckout(p.id)}
              className="mt-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
            >
              {p.unit_amount === 0 ? "Get Started" : "Subscribe"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
